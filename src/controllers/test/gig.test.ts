import {NextFunction, Request, Response} from "express";
import {authUserPayload, gigMockRequest, gigMockResponse, IParams, sellerGig} from "./mocks/gig.mock";
import {gigCreateSchema} from "../../schemes/gig";
import {gigCreate} from "../create";
import {BadRequestError, ISearchResult} from "@kariru-k/gigconnect-shared";
import * as helper from '@kariru-k/gigconnect-shared';
import * as gigService from 'src/services/gig.service';
import * as gigCache from 'src/redis/gig.cache';
import * as searchService from 'src/services/search.service';
import * as elasticsearch from 'src/elasticsearch';
import { jest } from '@jest/globals';
import {gigDelete} from "../delete";
import {StatusCodes} from "http-status-codes";
import {gigById, gigsByCategory, moreLikeThis, SellerGigs, sellerInactiveGigs, topRatedGigsByCategory} from "../get";
import Joi, {ValidationResult} from "joi";
import {UploadApiResponse} from "cloudinary";

describe('Gig Controller', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    describe('Gig Create Method', () => {
        it('should call next with BadRequestError for invalid schema data', () => {
            const req: Request = gigMockRequest({}, sellerGig, authUserPayload) as unknown as Request;
            const res: Response = gigMockResponse();
            const next = jest.fn();
            const mockJoiError = new Joi.ValidationError(
                'Validation Failed',
                [
                    {
                        message: 'This is an error message',
                        path: ['description'],
                        type: 'any.required',
                        context: { key: 'description', label: 'description', value: '' }
                    }
                ],
                {} // This represents the original unvalidated object
            );

            // 2. Mock the implementation synchronously
            jest.spyOn(gigCreateSchema, 'validate').mockImplementation((): ValidationResult => {
                return {
                    error: mockJoiError,
                    value: null // Or your mock body if needed
                };
            });

            gigCreate(req, res, next).then(() => {
                expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            });
        });

        it('should call next with BadRequestError for file upload error', async() => {
            const req: Request = gigMockRequest({}, sellerGig, authUserPayload) as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();

            // Mock the validate function to pass, as this test is for the file upload logic
            jest.spyOn(gigCreateSchema, 'validate').mockReturnValue({
                error: undefined
            } as ValidationResult);

            jest.spyOn(helper, 'uploads').mockResolvedValue(undefined);

            await gigCreate(req, res, next);

            // Fixed assertion to check for an instance of BadRequestError and its properties.
            const errorInstance = new BadRequestError('File upload error', 'create gig() method error');
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                name: errorInstance.name,
                message: errorInstance.message,
            }));
        });

        it('should return StatusCodes.Created and Json with message and createdGig', () => {
            const req: Request = gigMockRequest({}, sellerGig, authUserPayload) as unknown as Request;
            const res: Response = gigMockResponse();
            const next = jest.fn();
            jest.spyOn(gigCreateSchema, 'validate').mockReturnValue({
                error: undefined
            } as ValidationResult);

            jest.spyOn(helper, 'uploads').mockImplementation(() => Promise.resolve({public_id: 'some-id', secure_url: 'some-url'} as UploadApiResponse))
            jest.spyOn(elasticsearch, 'getDocumentCount').mockResolvedValue(1)
            jest.spyOn(gigService, 'createGig').mockResolvedValue(sellerGig)
            gigCreate(req, res, next).then(() => {
                expect(res.status).toHaveBeenCalledWith(201);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Gig created successfully',
                    gig: sellerGig
                });
            })
        });
    })
    describe('Gig Delete Method', () => {
        it('should return StatusCodes.OK and a success message', async () => {
            // Refactored to use the single gigMockRequest
            const req: Request = gigMockRequest({}, sellerGig, authUserPayload, {}) as unknown as Request;
            req.params = { gigId: 'mockGigId', sellerId: 'mockSellerId' };

            const res: Response = gigMockResponse();
            const next = jest.fn();

            jest.spyOn(gigService, 'deleteGig').mockResolvedValue(undefined);

            await gigDelete(req, res, next);

            expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(res.json).toHaveBeenCalledWith({ message: 'Gig deleted successfully' });
            expect(gigService.deleteGig).toHaveBeenCalledWith('mockGigId', 'mockSellerId');
        });

        it('should call next with an error if deleteGig fails', async () => {
            // Refactored to use the single gigMockRequest
            const req: Request = gigMockRequest({}, sellerGig, authUserPayload, {}) as unknown as Request;
            req.params = { gigId: 'mockGigId', sellerId: 'mockSellerId' };

            const res: Response = gigMockResponse();
            const next = jest.fn();
            const error = new Error('Database Error');

            jest.spyOn(gigService, 'deleteGig').mockRejectedValue(error);

            await gigDelete(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
    describe('GigById Method', () => {
        it('should return StatusCodes.OK and a gig object', async () => {
            // Correct approach: Set the gigId in params to match the ID of the mock gig object.
            const req = {
                params: {
                    gigId: sellerGig.id
                }
            } as unknown as Request;

            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();

            jest.spyOn(gigService, 'getGigById').mockResolvedValue(sellerGig);

            await gigById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(res.json).toHaveBeenCalledWith({ message: 'Gig fetched successfully', gig: sellerGig });
        });

        it('should call next with an error if getGigById fails', async () => {
            const req = {
                params: {
                    gigId: sellerGig.id
                }
            } as unknown as Request;

            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();
            const error = new Error('Database Error');

            jest.spyOn(gigService, 'getGigById').mockRejectedValue(error);

            await gigById(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
    describe('SellerGigs Method', () => {
        it('should return StatusCodes.OK and an array of gigs', async () => {
            // Manually build the mock request to include sellerId in params
            const req = {
                params: {
                    sellerId: 'mockSellerId'
                }
            } as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();

            jest.spyOn(gigService, 'getSellerGigs').mockResolvedValue([sellerGig, sellerGig]);

            await SellerGigs(req, res, next);

            expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(res.json).toHaveBeenCalledWith({ message: 'Gigs fetched successfully', gigs: [sellerGig, sellerGig] });
        });

        it('should call next with an error if getSellerGigs fails', async () => {
            // Manually build the mock request to include sellerId in params
            const req = {
                params: {
                    sellerId: 'mockSellerId'
                }
            } as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();
            const error = new Error('Database Error');

            jest.spyOn(gigService, 'getSellerGigs').mockRejectedValue(error);

            await SellerGigs(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
    describe('sellerInactiveGigs Method', () => {
        it('should return StatusCodes.OK and an array of inactive gigs', async () => {
            // Manually build the mock request to include sellerId in params
            const req = {
                params: {
                    sellerId: 'mockSellerId'
                }
            } as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();

            jest.spyOn(gigService, 'getSellerInactiveGigs').mockResolvedValue([sellerGig, sellerGig]);

            await sellerInactiveGigs(req, res, next);

            expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(res.json).toHaveBeenCalledWith({ message: 'Inactive gigs fetched successfully', gigs: [sellerGig, sellerGig] });
        });

        it('should call next with an error if getSellerInactiveGigs fails', async () => {
            // Manually build the mock request to include sellerId in params
            const req = {
                params: {
                    sellerId: 'mockSellerId'
                }
            } as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();
            const error = new Error('Database Error');

            jest.spyOn(gigService, 'getSellerInactiveGigs').mockRejectedValue(error);

            await sellerInactiveGigs(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
    describe('topRatedGigsByCategory Method', () => {
        it('should return StatusCodes.OK and a list of top-rated gigs', async () => {
            // This test correctly uses the username property of IParams
            const params: IParams = { username: 'Danny' };
            const req = { params: params } as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();

            const mockSearchResult = {
                hits: [{ _source: sellerGig }, { _source: sellerGig }],
                total: 2,
            };

            jest.spyOn(gigCache, 'getUserSelectedGigCategory').mockResolvedValue('programming');
            jest.spyOn(searchService, 'getTopRatedGigsByCategory').mockReturnValue(Promise.resolve(mockSearchResult as ISearchResult));

            await topRatedGigsByCategory(req, res, next);

            expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Top rated gigs fetched successfully',
                total: 2,
                gigs: [sellerGig, sellerGig],
            });
        });

        it('should call next with an error if getTopRatedGigsByCategory fails', async () => {
            // This test correctly uses the username property of IParams
            const params: IParams = { username: 'Danny' };
            const req = { params: params } as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();
            const error = new Error('Search Service Error');

            jest.spyOn(gigCache, 'getUserSelectedGigCategory').mockResolvedValue('programming');
            jest.spyOn(searchService, 'getTopRatedGigsByCategory').mockRejectedValue(error);

            await topRatedGigsByCategory(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
    describe('gigsByCategory Method', () => {
        it('should return StatusCodes.OK and a list of gigs by category', async () => {
            // This test correctly uses the username property of IParams
            const params: IParams = { username: 'Danny' };
            const req = { params: params } as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();

            const mockSearchResult = {
                hits: [{ _source: sellerGig }, { _source: sellerGig }],
                total: 2,
            };

            jest.spyOn(gigCache, 'getUserSelectedGigCategory').mockResolvedValue('programming');
            jest.spyOn(searchService, 'gigsSearchByCategory').mockReturnValue(Promise.resolve(mockSearchResult as ISearchResult));

            await gigsByCategory(req, res, next);

            expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Search Gigs Category Result',
                total: 2,
                gigs: [sellerGig, sellerGig],
            });
        });

        it('should call next with an error if gigsSearchByCategory fails', async () => {
            // This test correctly uses the username property of IParams
            const params: IParams = { username: 'Danny' };
            const req = { params: params } as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();
            const error = new Error('Search Service Error');

            jest.spyOn(gigCache, 'getUserSelectedGigCategory').mockResolvedValue('programming');
            jest.spyOn(searchService, 'gigsSearchByCategory').mockRejectedValue(error);

            await gigsByCategory(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
    describe('moreLikeThis Method', () => {
        it('should return StatusCodes.OK and a list of similar gigs', async () => {
            // Manually build the mock request to include gigId in params
            const req = {
                params: {
                    gigId: 'mockGigId'
                }
            } as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();

            const mockSearchResult = {
                hits: [{ _source: sellerGig }, { _source: sellerGig }],
                total: 2,
            };

            jest.spyOn(searchService, 'getMoreGigsLikeThis').mockReturnValue(Promise.resolve(mockSearchResult as ISearchResult));

            await moreLikeThis(req, res, next);

            expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
            expect(res.json).toHaveBeenCalledWith({
                message: 'More Gigs Like This Result',
                total: 2,
                gigs: [sellerGig, sellerGig],
            });
        });

        it('should call next with an error if getMoreGigsLikeThis fails', async () => {
            // Manually build the mock request to include gigId in params
            const req = {
                params: {
                    gigId: 'mockGigId'
                }
            } as unknown as Request;
            const res: Response = gigMockResponse();
            const next: NextFunction = jest.fn();
            const error = new Error('Search Service Error');

            jest.spyOn(searchService, 'getMoreGigsLikeThis').mockRejectedValue(error);

            await moreLikeThis(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
})
