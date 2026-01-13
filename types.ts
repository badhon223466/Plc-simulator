
export type AddressType = 'I' | 'Q' | 'M' | 'DB' | 'T' | 'C' | 'D';

export interface Tag {
  id: string;
  address: string;
  name: string;
  dataType: 'BOOL' | 'INT' | 'REAL' | 'TIME';
  comment?: string;
  value: any;
  forced?: boolean;
}

export enum InstructionType {
  NO = 'NO',           // Normally Open
  NC = 'NC',           // Normally Closed
  COIL = 'COIL',       // Normal Coil
  SET = 'SET',         // Set Coil
  RESET = 'RESET',     // Reset Coil
  SR = 'SR',           // Set-Reset Flip-Flop
  RS = 'RS',           // Reset-Set Flip-Flop
  AND = 'AND',         // Logic AND Gate
  OR = 'OR_GATE',      // Logic OR Gate (Renamed to avoid conflict with branch label)
  XOR = 'XOR',         // Logic XOR Gate
  TON = 'TON',         // On Delay Timer
  TOF = 'TOF',         // Off Delay Timer
  TONR = 'TONR',       // Retentive Timer
  CTU = 'CTU',         // Up Counter
  CTD = 'CTD',         // Down Counter
  CTUD = 'CTUD',       // Up/Down Counter
  MOV = 'MOV',         // Move
  SCP = 'SCP',         // Scale
  PID = 'PID',         // PID Controller
  NORM_X = 'NORM_X',   // Normalize
  SCALE_X = 'SCALE_X', // Scale
  DIV = 'DIV',         // Divide
  MUL = 'MUL',         // Multiply
  SUB = 'SUB',         // Subtract
  ADD = 'ADD',         // Add
  // Comparison Instructions
  EQ = 'EQ',           // Equal
  NE = 'NE',           // Not Equal
  GT = 'GT',           // Greater Than
  LT = 'LT',           // Less Than
  GE = 'GE',           // Greater or Equal
  LE = 'LE'            // Less or Equal
}

export interface Instruction {
  id: string;
  type: InstructionType;
  tagId?: string;       
  params?: {            
    preset?: number;     // Primary constant (PT, PV, IN1)
    preset2?: number;    // Secondary constant (MIN, IN2)
    preset3?: number;    // Tertiary constant (MAX)
    current?: number;
    timeUnit?: 'ms' | 's';
    kp?: number;
    ki?: number;
    kd?: number;
    setpoint?: number;
    inMin?: number;
    inMax?: number;
    outMin?: number;
    outMax?: number;
    sourceTagId?: string;
    destTagId?: string;
    minTagId?: string;
    maxTagId?: string;
    resetTagId?: string; 
  };
  isActive?: boolean;
  powerFlowOut?: boolean;
  forced?: 'ON' | 'OFF' | null;
}

export interface BranchGroup {
  id: string;
  branches: LadderElement[][];
  isActive?: boolean;
  powerFlowOut?: boolean;
}

export type LadderElement = Instruction | BranchGroup;

export function isBranchGroup(element: LadderElement): element is BranchGroup {
  return (element as BranchGroup).branches !== undefined;
}

export interface Rung {
  id: string;
  elements: LadderElement[];
  comment?: string;
}

export interface Network {
  id: string;
  title: string;
  comment?: string;
  rungs: Rung[];
}

export interface PLCProject {
  name: string;
  version: string;
  networks: Network[];
  tags: Tag[];
}

export interface PLCTask {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  conditions: {
    tagId: string;
    targetValue: any;
  }[];
  isCompleted?: boolean;
}

export enum PLCMode {
  STOP = 'STOP',
  RUN = 'RUN',
  PAUSE = 'PAUSE',
  ONLINE = 'ONLINE',
}
