jest.mock('../src/models/User', () => ({
  findById: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../src/models/Task', () => ({
  create: jest.fn()
}));

jest.mock('../src/models/EmailLog', () => ({
  create: jest.fn()
}));

jest.mock('../src/services/email.service', () => ({
  sendTaskNotificationEmail: jest.fn(),
  buildTaskNotificationEmailData: jest.fn((payload) => {
    const isSelfCreated = !payload.assignedByUser || payload.assignedByUser._id?.toString() === payload.recipientUser._id?.toString();

    return {
      recipientEmail: payload.recipientUser.email,
      recipientName: payload.recipientUser.name,
      taskTitle: payload.task.title,
      description: payload.task.description,
      priority: payload.task.priority,
      status: payload.task.status,
      dueDate: payload.task.dueDate,
      assignedBy: isSelfCreated ? payload.recipientUser.name : payload.assignedByUser.name,
      assignmentTime: payload.task.createdAt,
      taskType: isSelfCreated ? 'self-created' : 'assigned',
      dashboardUrl: payload.dashboardUrl
    };
  })
}));

const AdminService = require('../src/services/admin.service');
const Task = require('../src/models/Task');
const User = require('../src/models/User');
const { sendTaskNotificationEmail, buildTaskNotificationEmailData } = require('../src/services/email.service');

describe('AdminService.createTaskForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds email payload data for task notification emails', () => {
    const emailData = buildTaskNotificationEmailData({
      recipientUser: {
        _id: 'user-123',
        name: 'Jane Doe',
        email: 'jane@example.com'
      },
      task: {
        title: 'Write report',
        description: 'Finish the weekly report',
        priority: 'high',
        status: 'pending',
        dueDate: '2026-07-10T00:00:00.000Z',
        createdAt: '2026-07-08T10:00:00.000Z'
      },
      assignedByUser: {
        _id: 'user-123',
        name: 'Jane Doe',
        email: 'jane@example.com'
      },
      dashboardUrl: 'http://localhost:5173/dashboard'
    });

    expect(emailData).toEqual(expect.objectContaining({
      recipientEmail: 'jane@example.com',
      recipientName: 'Jane Doe',
      taskType: 'self-created',
      assignedBy: 'Jane Doe'
    }));
  });

  it('creates a task for a target user and reports email status', async () => {
    User.findById.mockResolvedValue({
      _id: 'user-123',
      name: 'Jane Doe',
      email: 'jane@example.com'
    });

    Task.create.mockResolvedValue({
      _id: 'task-123',
      title: 'New task',
      description: 'Description',
      status: 'pending',
      priority: 'high',
      dueDate: null,
      createdAt: new Date()
    });

    sendTaskNotificationEmail.mockResolvedValue({ success: true });

    const result = await AdminService.createTaskForUser(
      {
        userId: 'user-123',
        title: 'New task',
        description: 'Description',
        status: 'pending',
        priority: 'high'
      },
      {
        _id: 'admin-123',
        name: 'Admin User',
        email: 'admin@example.com'
      }
    );

    expect(Task.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-123',
      title: 'New task',
      description: 'Description',
      status: 'pending',
      priority: 'high'
    }));
    expect(sendTaskNotificationEmail).toHaveBeenCalled();
    expect(result.emailSent).toBe(true);
    expect(result.emailStatus).toBe('SUCCESS');
  });
});
