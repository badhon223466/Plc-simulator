
import { PLCProject, Tag, InstructionType } from './types';

export const COLORS = {
  tiaBlue: '#006487',
  tiaLightBlue: '#0099C4',
  tiaGray: '#C5D1D8',
  tiaDarkGray: '#4D4D4D',
  tiaSelection: '#FFA500',
  powerFlow: '#00FF00',
  inactive: '#999',
  error: '#FF0000',
  branch: '#006487'
};

export const DEFAULT_TAGS: Tag[] = [
  { id: '1', address: 'I0.0', name: 'Start_PB', dataType: 'BOOL', value: false },
  { id: '2', address: 'I0.1', name: 'Stop_PB', dataType: 'BOOL', value: false },
  { id: '3', address: 'Q0.0', name: 'Motor_Main', dataType: 'BOOL', value: false },
  { id: '4', address: 'M0.0', name: 'System_Ready', dataType: 'BOOL', value: false },
  { id: '5', address: 'DB1.INT0', name: 'Speed_Ref', dataType: 'INT', value: 0 },
  { id: '6', address: 'IW64', name: 'Analog_In', dataType: 'INT', value: 13824 },
  { id: '7', address: 'QW80', name: 'Control_Out', dataType: 'INT', value: 0 },
  { id: 't0', address: 'T0', name: 'Timer_1', dataType: 'TIME', value: 0 },
  { id: 't1', address: 'T1', name: 'Timer_2', dataType: 'TIME', value: 0 },
  { id: 'c0', address: 'C0', name: 'Counter_1', dataType: 'INT', value: 0 },
  { id: 'c1', address: 'C1', name: 'Counter_2', dataType: 'INT', value: 0 },
  // Data Registers starting from D0
  { id: 'd0', address: 'D0', name: 'Data_Reg_0', dataType: 'INT', value: 100 },
  { id: 'd1', address: 'D1', name: 'Data_Reg_1', dataType: 'INT', value: 0 },
  { id: 'd2', address: 'D2', name: 'Data_Reg_2', dataType: 'INT', value: 0 },
  { id: 'd3', address: 'D3', name: 'Data_Reg_3', dataType: 'INT', value: 0 },
  { id: 'd4', address: 'D4', name: 'Data_Reg_4', dataType: 'INT', value: 0 },
  { id: 'd5', address: 'D5', name: 'Data_Reg_5', dataType: 'INT', value: 0 },
  { id: 'd6', address: 'D6', name: 'Data_Reg_6', dataType: 'INT', value: 0 },
  { id: 'd7', address: 'D7', name: 'Data_Reg_7', dataType: 'INT', value: 0 },
  { id: 'd8', address: 'D8', name: 'Data_Reg_8', dataType: 'INT', value: 0 },
  { id: 'd9', address: 'D9', name: 'Data_Reg_9', dataType: 'INT', value: 0 },
  { id: 'd10', address: 'D10', name: 'Data_Reg_10', dataType: 'INT', value: 0 },
  { id: 'd11', address: 'D11', name: 'Data_Reg_11', dataType: 'INT', value: 0 },
  { id: 'd12', address: 'D12', name: 'Data_Reg_12', dataType: 'INT', value: 0 },
  { id: 'd13', address: 'D13', name: 'Data_Reg_13', dataType: 'INT', value: 0 },
  { id: 'd14', address: 'D14', name: 'Data_Reg_14', dataType: 'INT', value: 0 },
  { id: 'd15', address: 'D15', name: 'Data_Reg_15', dataType: 'INT', value: 0 },
];

export const INITIAL_PROJECT: PLCProject = {
  name: 'Training_Project_v1',
  version: '19.0.0',
  tags: [...DEFAULT_TAGS],
  networks: [
    {
      id: 'net_1',
      title: 'Main Program Block',
      comment: 'Network 1: Initial empty network for logic programming.',
      rungs: [
        {
          id: 'rung_initial',
          elements: []
        }
      ]
    }
  ],
};
