import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { mockThrottler } from './throttler.mock.js';

mockThrottler();

const { setupApp } = await import('../src/app.setup.js');
const { AuthController } =
  await import('../src/modules/auth/controller/index.js');
const { EmailVerificationService, SessionService } =
  await import('../src/modules/auth/services/index.js');
const { IngredientController } =
  await import('../src/modules/ingredient/controller/index.js');
const { IngredientService } =
  await import('../src/modules/ingredient/service/index.js');
const { MealController } =
  await import('../src/modules/meal/controller/index.js');
const { MealService } = await import('../src/modules/meal/service/index.js');
const { MealPlanController } =
  await import('../src/modules/meal-plan/controller/index.js');
const { MealPlanService } =
  await import('../src/modules/meal-plan/service/index.js');

const crud = () => ({
  getOne: jest.fn(),
  getAll: jest.fn(),
  createOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(async () => undefined),
});

const ingredient = {
  name: 'Apple',
  protein: 10,
  totalFat: 5,
  saturatedFat: 2,
  totalCarbohydrates: 30,
  sugar: 10,
  dietaryFiber: 5,
  calories: 200,
  unit: '100g',
};

// Malformed numeric input must be rejected by validation (400), never reach the DB (500)
describe('Malformed numeric input (e2e)', () => {
  let app: INestApplication;

  const services = {
    ingredient: crud(),
    meal: crud(),
    mealPlan: crud(),
    session: { signUp: jest.fn(), signIn: jest.fn() },
  };

  const reached = () =>
    Object.values(services).flatMap((s) =>
      Object.values(s).filter((fn: jest.Mock) => fn.mock.calls.length > 0),
    );

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule.register({})],
      controllers: [
        AuthController,
        IngredientController,
        MealController,
        MealPlanController,
      ],
      providers: [
        { provide: IngredientService, useValue: services.ingredient },
        { provide: MealService, useValue: services.meal },
        { provide: MealPlanService, useValue: services.mealPlan },
        { provide: SessionService, useValue: services.session },
        { provide: EmailVerificationService, useValue: {} },
        // Stands in for the global JwtGuard
        {
          provide: APP_GUARD,
          useValue: {
            canActivate: (context: ExecutionContext) => {
              context.switchToHttp().getRequest().user = {
                userId: 1,
                sessionId: 'session-1',
              };
              return true;
            },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  describe('non-integer id params', () => {
    it.each([
      ['get', '/api/meal/abc'],
      ['patch', '/api/meal/abc'],
      ['delete', '/api/meal/1.5'],
      ['get', '/api/meal-plan/abc'],
      ['patch', '/api/meal-plan/abc'],
      ['delete', '/api/meal-plan/abc'],
      ['patch', '/api/ingredient/abc'],
      ['delete', '/api/ingredient/abc'],
    ] as const)('%s %s → 400', async (method, url) => {
      await request(app.getHttpServer())
        [method](url)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
      expect(reached()).toHaveLength(0);
    });

    it('passes an integer id through as a number', async () => {
      await request(app.getHttpServer())
        .delete('/api/meal/1')
        .expect(HttpStatus.NO_CONTENT);
      expect(services.meal.deleteOne).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('decimal fields above column precision', () => {
    it('POST /api/ingredient with a nutrient above decimal(10,1) → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ingredient')
        .send({ ...ingredient, calories: 1_000_000_000 })
        .expect(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toEqual([
        expect.stringContaining('calories must not be greater than'),
      ]);
      expect(reached()).toHaveLength(0);
    });

    it('PATCH /api/ingredient/1 with a nutrient above decimal(10,1) → 400', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/ingredient/1')
        .send({ protein: 1e12 })
        .expect(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toEqual([
        expect.stringContaining('protein must not be greater than'),
      ]);
      expect(reached()).toHaveLength(0);
    });

    it('POST /api/meal with a quantity above decimal(10,2) → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/meal')
        .send({
          name: 'Salad',
          mealIngredients: [{ ingredientId: 1, quantity: 100_000_000 }],
        })
        .expect(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toEqual([
        expect.stringContaining('quantity must not be greater than'),
      ]);
      expect(reached()).toHaveLength(0);
    });
  });

  describe('ingredientId', () => {
    it.each(['1.5', '0', '-1'].map(Number))(
      'POST /api/meal with ingredientId %p → 400',
      async (id) => {
        await request(app.getHttpServer())
          .post('/api/meal')
          .send({
            name: 'Salad',
            mealIngredients: [{ ingredientId: id, quantity: 100 }],
          })
          .expect(HttpStatus.BAD_REQUEST);
        expect(reached()).toHaveLength(0);
      },
    );
  });

  describe('non-string email', () => {
    it.each([
      ['/api/auth/signup', { password: 'x', confirmPassword: 'x' }],
      ['/api/auth/signin', { password: 'x' }],
    ])('POST %s → 400', async (url, body) => {
      await request(app.getHttpServer())
        .post(url)
        .send({ ...body, email: 123 })
        .expect(HttpStatus.BAD_REQUEST);
      expect(reached()).toHaveLength(0);
    });
  });
});
