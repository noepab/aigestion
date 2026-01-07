export interface IJobData {
  [key: string]: any;
}

export enum JobName {
  EMAIL_SEND = 'email-send',
  DATA_PROCESSING = 'data-processing',
}

export interface IJobPayloads {
  [JobName.EMAIL_SEND]: {
    to: string;
    subject: string;
    body: string;
  };
  [JobName.DATA_PROCESSING]: {
    fileKey: string;
  };
}
