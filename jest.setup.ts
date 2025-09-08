// Mock database.ts
jest.mock('./src/database', () => {
    const mockModelMethods = {
        addHook: jest.fn(),
        sync: jest.fn(),
        prototype: {
            comparePassword: jest.fn(),
            hashPassword: jest.fn(),
        },
    };

    return {
        sequelize: {
            define: jest.fn(() => mockModelMethods),
            authenticate: jest.fn().mockResolvedValue(true),
        },
        databaseConnection: jest.fn().mockResolvedValue(undefined),
    };
});



jest.mock('src/services/auth.service');
jest.mock('src/queues/auth.producer');
jest.mock('src/schemas/password');
jest.mock('src/schemas/signin');

jest.mock('src/schemas/signup');
jest.mock('uuid', () => ({
    v4: () => 'mock-uuid',
}));
