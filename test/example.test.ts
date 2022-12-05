import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { printNode, withGetType, zodToTs } from '../src'

enum Fruits {
  Apple = 'apple',
  Banana = 'banana',
  Cantaloupe = 'cantaloupe',
  A = 5,
}

const example2 = z.object({
  a: z.string(),
  b: z.number(),
  c: z.array(z.string()).nonempty().length(10),
  d: z.object({
    e: z.string(),
  }),
})

const pickedSchema = example2.partial()

const nativeEnum = withGetType(z.nativeEnum(Fruits), (ts, _, options) => {
  const identifier = ts.factory.createIdentifier('Fruits')

  if (options.resolveNativeEnums) return identifier

  return ts.factory.createTypeReferenceNode(
    identifier,
    undefined,
  )
})

type ELazy = {
  a: string
  b: ELazy
}

const eLazy: z.ZodSchema<ELazy> = withGetType(
  z.lazy(() => e3),
  (ts, identifier) =>
    ts.factory.createIndexedAccessTypeNode(
      ts.factory.createTypeReferenceNode(
        ts.factory.createIdentifier(identifier),
        undefined,
      ),
      ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('b')),
    ),
)

const e3 = z.object({
  a: z.string(),
  b: eLazy,
})

const dateType = withGetType(
  z.instanceof(Date),
  (ts) => ts.factory.createIdentifier('Date'),
)

const example = z.object({
  a: z.string(),
  b: z.number(),
  c: z.array(z.object({
    a: z.string(),
  })),
  d: z.boolean(),
  e: eLazy,
  f: z.union([z.object({ a: z.number() }), z.literal('hi')]),
  g: z.enum(['hi', 'bye']),
  h: z.number().and(z.bigint()).and(z.number().and(z.string())).transform((arg) => console.log(arg)),
  i: z.date(),
  j: z.undefined(),
  k: z.null(),
  l: z.void(),
  m: z.any(),
  n: z.unknown(),
  o: z.never(),
  p: z.optional(z.string()),
  q: z.nullable(pickedSchema),
  r: z.tuple([z.string(), z.number(), z.object({ name: z.string() })]),
  s: z.record(z.object({
    de: z.object({
      me: z.union([z.tuple([z.string(), z.object({ a: z.string() })]), z.bigint()]).array(),
    }),
  })),
  t: z.map(z.string(), z.array(z.object({ p: z.string() }))),
  u: z.set(z.string()),
  v: z.intersection(z.string(), z.number()).or(z.bigint()),
  w: z.promise(z.number()),
  x: z.function().args(z.string().nullish().default('heo'), z.boolean(), z.boolean()).returns(z.string()),
  y: z.string().optional().default('hi'),
  z: z.string().refine((val) => val.length > 10).or(z.number()).and(z.bigint().nullish().default(1000n)),
  aa: nativeEnum,
  bb: dateType,
  cc: z.lazy(() => z.string()),
  dd: z.nativeEnum(Fruits),
  ee: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('circle'), radius: z.number() }),
    z.object({ kind: z.literal('square'), x: z.number() }),
    z.object({ kind: z.literal('triangle'), x: z.number(), y: z.number() }),
  ]),
})

describe('Example', () => {
  it('should produce the expected results', () => {
    const { node, store } = zodToTs(example, 'Example', { resolveNativeEnums: true })

    const output = [printNode(node)].concat(store.nativeEnums.map((e) => printNode(e))).join('\n\n')

    expect(output).toMatchInlineSnapshot(`
      "{
          a: string;
          b: number;
          c: {
              a: string;
          }[];
          d: boolean;
          e: Example[\\"b\\"];
          f: {
              a: number;
          } | \\"hi\\";
          g: \\"hi\\" | \\"bye\\";
          h: (number & bigint) & (number & string);
          i: Date;
          j?: undefined;
          k: null;
          l?: void | undefined;
          m?: any;
          n?: unknown;
          o: never;
          p?: string | undefined;
          q: {
              a?: string | undefined;
              b?: number | undefined;
              c?: string[] | undefined;
              d?: {
                  e: string;
              } | undefined;
          } | null;
          r: [
              string,
              number,
              {
                  name: string;
              }
          ];
          s: {
              [x: string]: {
                  de: {
                      me: ([
                          string,
                          {
                              a: string;
                          }
                      ] | bigint)[];
                  };
              };
          };
          t: Map<string, {
              p: string;
          }[]>;
          u: Set<string>;
          v: (string & number) | bigint;
          w: Promise<number>;
          x: (args_0: (string | undefined) | null, args_1: boolean, args_2: boolean, ...args_3: unknown[]) => string;
          y?: string;
          z: (string | number) & ((bigint | undefined) | null);
          aa: Fruits;
          bb: Date;
          cc: Example;
          dd: unknown;
          ee: {
              kind: \\"circle\\";
              radius: number;
          } | {
              kind: \\"square\\";
              x: number;
          } | {
              kind: \\"triangle\\";
              x: number;
              y: number;
          };
      }

      enum Fruits {
          \\"5\\" = \\"A\\",
          Apple = \\"apple\\",
          Banana = \\"banana\\",
          Cantaloupe = \\"cantaloupe\\",
          A = 5
      }"
    `)
  })
})
