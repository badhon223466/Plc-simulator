
import { PLCProject, PLCMode, InstructionType, Tag, LadderElement, isBranchGroup, BranchGroup, Instruction } from '../types';

export class PLCEngine {
  private project: PLCProject;
  private mode: PLCMode = PLCMode.STOP;
  private scanTime: number = 50; 
  private intervalId: any = null;
  private onUpdate: (project: PLCProject) => void;

  private timerStates: Record<string, { current: number; running: boolean; lastPowerIn: boolean | null }> = {};
  private counterStates: Record<string, { count: number; lastInput: boolean | null; lastDownInput: boolean | null }> = {};
  private pidStates: Record<string, { integral: number; lastError: number }> = {};
  
  constructor(project: PLCProject, onUpdate: (project: PLCProject) => void) {
    this.project = project;
    this.onUpdate = onUpdate;
  }

  public setMode(mode: PLCMode) {
    const prevMode = this.mode;
    this.mode = mode;
    
    if (mode === PLCMode.RUN) {
      if (prevMode === PLCMode.STOP) {
        this.clearInternalStates();
      }
      this.startScan();
    } else if (mode === PLCMode.STOP) {
      this.stopScan();
      this.fullReset();
    } else if (mode === PLCMode.PAUSE) {
      this.stopScan();
    }
  }

  private fullReset() {
    this.project.tags.forEach(tag => {
      if (tag.dataType === 'BOOL') {
        tag.value = false;
      } else {
        tag.value = 0;
      }
    });

    this.timerStates = {};
    this.counterStates = {};
    this.pidStates = {};

    this.project.networks.forEach(net => {
      net.rungs.forEach(rung => {
        this.resetElementsState(rung.elements);
      });
    });

    this.triggerUpdate();
  }

  private resetElementsState(elements: LadderElement[]) {
    elements.forEach(el => {
      el.isActive = false;
      el.powerFlowOut = false;
      if (isBranchGroup(el)) {
        el.branches.forEach(branch => this.resetElementsState(branch));
      } else {
        const inst = el as Instruction;
        if (inst.params) {
          inst.params.current = 0;
        }
      }
    });
  }

  private clearInternalStates() {
    Object.keys(this.counterStates).forEach(key => {
      this.counterStates[key].lastInput = null;
    });
    Object.keys(this.timerStates).forEach(key => {
      this.timerStates[key].lastPowerIn = null;
    });
    this.pidStates = {};
  }

  public updateProject(project: PLCProject) {
    this.project = project;
  }

  private startScan() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.scan(), this.scanTime);
  }

  private stopScan() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private canWriteToTag(tag: Tag): boolean {
    if (tag.forced) return false;
    // Physical inputs cannot be written by PLC logic normally, 
    // but in simulation we allow writing to M and Q.
    if (tag.address.startsWith('I')) return false; 
    return true;
  }

  private scan() {
    // Deep clone tags to ensure state detection in React
    const nextTags = this.project.tags.map(t => ({...t}));
    const tempProject = { ...this.project, tags: nextTags };

    tempProject.networks.forEach((network) => {
      network.rungs.forEach((rung) => {
        this.evaluateElements(rung.elements, true, tempProject);
      });
    });

    this.project.tags = nextTags;
    this.triggerUpdate();
  }

  private triggerUpdate() {
    this.onUpdate({
      ...this.project,
      networks: [...this.project.networks],
      tags: [...this.project.tags]
    });
  }

  private evaluateElements(elements: LadderElement[], powerIn: boolean, project: PLCProject): boolean {
    let currentPower = powerIn;
    for (const element of elements) {
      if (isBranchGroup(element)) {
        let branchPowerOut = false;
        element.branches.forEach(branch => {
          if (this.evaluateElements(branch, currentPower, project)) {
            branchPowerOut = true;
          }
        });
        element.isActive = currentPower;
        element.powerFlowOut = branchPowerOut;
        currentPower = branchPowerOut;
      } else {
        currentPower = this.evaluateInstruction(element as Instruction, currentPower, project);
      }
    }
    return currentPower;
  }

  private evaluateInstruction(inst: Instruction, powerIn: boolean, project: PLCProject): boolean {
    const tag = project.tags.find((t: Tag) => t.id === inst.tagId);
    let powerOut = powerIn;

    switch (inst.type) {
      case InstructionType.NO:
        powerOut = powerIn && Boolean(tag?.value);
        break;
      case InstructionType.NC:
        powerOut = powerIn && !Boolean(tag?.value);
        break;
      case InstructionType.COIL:
        if (tag && this.canWriteToTag(tag)) {
          tag.value = powerIn;
        }
        powerOut = powerIn;
        break;
      case InstructionType.SET:
        // Latching logic: If powerIn is true, tag becomes TRUE and STAYS TRUE
        if (powerIn && tag && this.canWriteToTag(tag)) {
          tag.value = true;
        }
        powerOut = powerIn;
        break;
      case InstructionType.RESET:
        // Unlatching logic: If powerIn is true, tag becomes FALSE
        if (powerIn && tag && this.canWriteToTag(tag)) {
          tag.value = false;
        }
        powerOut = powerIn;
        break;
      case InstructionType.TON:
      case InstructionType.TOF:
        powerOut = powerIn && this.handleTimer(inst, powerIn, project);
        break;
      case InstructionType.CTU:
      case InstructionType.CTD:
        powerOut = powerIn && this.handleCounter(inst, powerIn, project);
        break;
      case InstructionType.MOV:
        if (powerIn) {
          const srcValue = this.getValue(project, inst.params?.sourceTagId, inst.params?.preset);
          const dest = project.tags.find(t => t.id === inst.params?.destTagId);
          if (dest && this.canWriteToTag(dest)) dest.value = srcValue;
        }
        powerOut = powerIn;
        break;
      case InstructionType.ADD:
      case InstructionType.SUB:
      case InstructionType.MUL:
      case InstructionType.DIV:
        this.handleMath(inst, powerIn, project);
        powerOut = powerIn;
        break;
      case InstructionType.EQ:
      case InstructionType.NE:
      case InstructionType.GT:
      case InstructionType.GE:
      case InstructionType.LT:
      case InstructionType.LE:
        powerOut = powerIn && this.handleCompare(inst, project);
        break;
      case InstructionType.PID:
        this.handlePID(inst, powerIn, project);
        powerOut = powerIn;
        break;
    }

    inst.isActive = powerIn;
    inst.powerFlowOut = powerOut;
    return powerOut;
  }

  private getValue(project: PLCProject, tagId?: string, fallback?: number): number {
    if (!tagId) return fallback !== undefined ? fallback : 0;
    const tag = project.tags.find(t => t.id === tagId);
    if (!tag) return fallback !== undefined ? fallback : 0;
    return Number(tag.value);
  }

  private handleTimer(inst: Instruction, powerIn: boolean, project: PLCProject): boolean {
    const stateKey = inst.tagId || inst.id;
    if (!this.timerStates[stateKey]) this.timerStates[stateKey] = { current: 0, running: false, lastPowerIn: powerIn };
    const state = this.timerStates[stateKey];
    const unitMultiplier = inst.params?.timeUnit === 's' ? 1000 : 1;
    const preset = (inst.params?.preset || 5) * unitMultiplier;
    let qOut = false;

    if (inst.type === InstructionType.TON) {
      if (powerIn) {
        state.current += this.scanTime;
        if (state.current >= preset) { state.current = preset; qOut = true; }
      } else state.current = 0;
    } else if (inst.type === InstructionType.TOF) {
      if (powerIn) { state.current = 0; qOut = true; }
      else {
        state.current += this.scanTime;
        if (state.current >= preset) { state.current = preset; qOut = false; }
        else qOut = true;
      }
    }
    if (inst.params) inst.params.current = state.current;
    return qOut;
  }

  private handleCounter(inst: Instruction, powerIn: boolean, project: PLCProject): boolean {
    const stateKey = inst.tagId || inst.id;
    if (!this.counterStates[stateKey]) this.counterStates[stateKey] = { count: 0, lastInput: powerIn, lastDownInput: false };
    const state = this.counterStates[stateKey];
    const resetTag = project.tags.find(t => t.id === inst.params?.resetTagId);
    
    if (Boolean(resetTag?.value)) {
      state.count = 0;
    } else if (powerIn && !state.lastInput) {
      if (inst.type === InstructionType.CTU) state.count++;
      else if (inst.type === InstructionType.CTD) state.count--;
    }
    
    state.lastInput = powerIn;
    const qOut = state.count >= (inst.params?.preset || 0);
    if (inst.params) inst.params.current = state.count;
    return qOut;
  }

  private handleMath(inst: Instruction, powerIn: boolean, project: PLCProject) {
    if (!powerIn) return;
    const v1 = this.getValue(project, inst.params?.sourceTagId, inst.params?.preset);
    const v2 = this.getValue(project, inst.params?.minTagId, inst.params?.preset2 ?? 0);
    let res = 0;
    switch (inst.type) {
      case InstructionType.ADD: res = v1 + v2; break;
      case InstructionType.SUB: res = v1 - v2; break;
      case InstructionType.MUL: res = v1 * v2; break;
      case InstructionType.DIV: res = v2 !== 0 ? v1 / v2 : 0; break;
    }
    const dest = project.tags.find(t => t.id === inst.params?.destTagId);
    if (dest && this.canWriteToTag(dest)) dest.value = res;
  }

  private handleCompare(inst: Instruction, project: PLCProject): boolean {
    const v1 = this.getValue(project, inst.params?.sourceTagId, inst.params?.preset);
    const v2 = this.getValue(project, inst.params?.minTagId, inst.params?.preset2 ?? 0);
    switch (inst.type) {
      case InstructionType.EQ: return v1 === v2;
      case InstructionType.NE: return v1 !== v2;
      case InstructionType.GT: return v1 > v2;
      case InstructionType.GE: return v1 >= v2;
      case InstructionType.LT: return v1 < v2;
      case InstructionType.LE: return v1 <= v2;
      default: return false;
    }
  }

  private handlePID(inst: Instruction, powerIn: boolean, project: PLCProject) {
    if (!powerIn) return;
    const sp = this.getValue(project, inst.params?.sourceTagId, inst.params?.setpoint);
    const pv = this.getValue(project, inst.params?.minTagId);
    const kp = inst.params?.kp || 1.0;
    const out = (sp - pv) * kp; 
    const dest = project.tags.find(t => t.id === inst.params?.destTagId);
    if (dest && this.canWriteToTag(dest)) dest.value = Number(out.toFixed(2));
  }
}
