import 'reflect-metadata';

import { jest } from '@jest/globals';
import nodemailer from 'nodemailer';
import { Container } from 'typedi';

import { EmailService } from '../../services/email.service';

const mockSendMail = jest.fn();
const mockVerify = jest.fn();

// Move mock implementation to allow accessing variables (or use factory correctly)
jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn(() => ({
      sendMail: mockSendMail,
      verify: mockVerify,
    })),
  };
});

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = Container.get(EmailService);
  });

  it('should create transporter on initialization', () => {
    expect(nodemailer.createTransport).toHaveBeenCalled();
  });

  describe('verifyConnection', () => {
    it('should return true on success', async () => {
      mockVerify.mockResolvedValue(true);
      const result = await service.verifyConnection();
      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockVerify.mockRejectedValue(new Error('Connection failed'));
      const result = await service.verifyConnection();
      expect(result).toBe(false);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });
      await service.sendEmail('test@example.com', 'Test Subject', 'Test Body');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: 'Test Body',
        })
      );
    });

    it('should throw error on failure', async () => {
      mockSendMail.mockRejectedValue(new Error('Send failed'));
      await expect(service.sendEmail('test', 'test', 'test')).rejects.toThrow('Send failed');
    });
  });
});
