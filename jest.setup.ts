// Mock database.ts
jest.mock('./src/database', () => {
    return {
        databaseConnection: jest.fn().mockResolvedValue(undefined),
    };
});



jest.mock('src/services/gig.service');
jest.mock('@kariru-k/gigconnect-shared');
jest.mock('src/elasticsearch');
jest.mock('src/schemes/gig');
jest.mock('@elastic/elasticsearch');
jest.mock('src/redis/redis.connection');
jest.mock('src/redis/gig.cache.ts');


jest.mock('uuid', () => ({
    v4: () => 'mock-uuid',
}));
