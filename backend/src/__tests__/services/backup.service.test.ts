import 'reflect-metadata';

import fs, { promises as fsPromises } from 'fs';
import path from 'path';

import { BackupService } from '../../services/backup.service';
import { GoogleDriveService } from '../../services/google/google-drive.service';

// Mock dependencies
jest.mock('../../services/google/google-drive.service', () => {
  return {
    GoogleDriveService: jest.fn().mockImplementation(() => ({
      findFolder: jest.fn(),
      listFolderContents: jest.fn(),
      downloadFile: jest.fn(),
      // other methods used in tests can be added as needed
    })),
  };
});
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn(),
    statSync: jest.fn(),
    readdirSync: jest.fn(),
    createReadStream: jest.fn(() => {
      const { Readable } = require('stream');
      const stream = new Readable({ read() { } });
      process.nextTick(() => {
        stream.emit('data', Buffer.from('test'));
        stream.emit('close');
      });
      return stream;
    }),
    createWriteStream: jest.fn(() => {
      const { Writable } = require('stream');
      const ws = new Writable({ write() { } });
      ws.on = jest.fn();
      return ws;
    }),
    mkdirSync: jest.fn(),
    promises: { mkdir: jest.fn() },
  };
});
jest.mock('../../utils/logger');

describe('BackupService', () => {
  let backupService: BackupService;
  let mockDriveService: jest.Mocked<GoogleDriveService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDriveService = new GoogleDriveService() as jest.Mocked<GoogleDriveService>;
    backupService = new BackupService(mockDriveService);

    // Default mock implementations
    (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
  });

  describe('restoreDirectory', () => {
    const targetDir = '/tmp/restore';
    const sourceFolder = 'Backups';
    const rootId = 'root-folder-id';

    it('should restore directory successfully', async () => {
      // Mock findFolder to return root ID
      mockDriveService.findFolder.mockResolvedValue(rootId);

      // Mock listFolderContents for root
      mockDriveService.listFolderContents.mockResolvedValueOnce([
        { id: 'file1-id', name: 'file1.txt', mimeType: 'text/plain', localHash: 'hash1' },
        { id: 'folder1-id', name: 'subfolder', mimeType: 'application/vnd.google-apps.folder' },
      ]);

      // Mock listFolderContents for subfolder
      mockDriveService.listFolderContents.mockResolvedValueOnce([
        { id: 'file2-id', name: 'file2.txt', mimeType: 'text/plain', localHash: 'hash2' },
      ]);

      // Mock fs.existsSync to return false (force download)
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Mock downloadFile
      mockDriveService.downloadFile.mockResolvedValue(undefined);

      await backupService.restoreDirectory(targetDir, sourceFolder);

      // Verify root folder search
      expect(mockDriveService.findFolder).toHaveBeenCalledWith(sourceFolder, 'root');

      // Verify directory listing
      expect(mockDriveService.listFolderContents).toHaveBeenCalledWith(rootId);
      expect(mockDriveService.listFolderContents).toHaveBeenCalledWith('folder1-id');

      // Verify mkdir calls
      expect(fsPromises.mkdir).toHaveBeenCalledWith(targetDir, { recursive: true });
      expect(fsPromises.mkdir).toHaveBeenCalledWith(path.join(targetDir, 'subfolder'), { recursive: true });

      // Verify file downloads
      expect(mockDriveService.downloadFile).toHaveBeenCalledWith('file1-id', path.join(targetDir, 'file1.txt'));
      expect(mockDriveService.downloadFile).toHaveBeenCalledWith('file2-id', path.join(targetDir, 'subfolder', 'file2.txt'));
    });

    it('should throw error if remote folder not found', async () => {
      mockDriveService.findFolder.mockResolvedValue(null);

      await expect(backupService.restoreDirectory(targetDir, sourceFolder))
        .rejects.toThrow(`Remote backup folder not found: ${sourceFolder}`);
    });

    it('should skip file if local hash matches', async () => {
      mockDriveService.findFolder.mockResolvedValue(rootId);
      mockDriveService.listFolderContents.mockResolvedValue([
        { id: 'file1-id', name: 'file1.txt', mimeType: 'text/plain', localHash: 'matching-hash' },
      ]);

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Mock calculateHash (private method, we need to spy or mock crypto/stream)
      // Since calculateHash is private and uses fs streams, it's hard to mock without mocking the whole stream chain.
      // Alternatively, we can cast backupService to any and mock the method if we want to isolate logic.
      const calculateHashSpy = jest.spyOn(backupService as any, 'calculateHash');
      calculateHashSpy.mockResolvedValue('matching-hash');

      await backupService.restoreDirectory(targetDir, sourceFolder);

      expect(mockDriveService.downloadFile).not.toHaveBeenCalled();
      expect(calculateHashSpy).toHaveBeenCalledWith(path.join(targetDir, 'file1.txt'));
    });

    it('should download file if local hash differs', async () => {
      mockDriveService.findFolder.mockResolvedValue(rootId);
      mockDriveService.listFolderContents.mockResolvedValue([
        { id: 'file1-id', name: 'file1.txt', mimeType: 'text/plain', localHash: 'remote-hash' },
      ]);

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const calculateHashSpy = jest.spyOn(backupService as any, 'calculateHash');
      calculateHashSpy.mockResolvedValue('different-local-hash');

      await backupService.restoreDirectory(targetDir, sourceFolder);

      expect(mockDriveService.downloadFile).toHaveBeenCalledWith('file1-id', path.join(targetDir, 'file1.txt'));
    });
  });
});
