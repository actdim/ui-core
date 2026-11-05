import { describe, it, expect, expectTypeOf } from 'vitest';
import { createTypedT, type TranslationKey, type TypedT, type UseTypedT, type PluralBase } from '@/i18n/useT';

type Res = {
    a: { x: string; y: { z: string } };
    b: { w: string; items_one: string; items_other: string; deep_name_few: string };
};

const useResT = createTypedT<Res>();
type TA = ReturnType<typeof useResT<'a'>>;

describe('createTypedT types', () => {
    it('accepts the nested keys of a namespace', () => {
        expectTypeOf<Parameters<TA>[0]>().toEqualTypeOf<'x' | 'y' | 'y.z'>();
        expectTypeOf<TranslationKey<Res['a']>>().toEqualTypeOf<'x' | 'y' | 'y.z'>();
    });

    it('rejects unknown keys', () => {
        const check = (t: TA): string => {
            // @ts-expect-error unknown key
            t('nope');
            return t('y.z');
        };
        expect(typeof check).toBe('function');
    });

    it('names the hook and t types', () => {
        expectTypeOf(useResT).toEqualTypeOf<UseTypedT<Res>>();
        expectTypeOf<TA>().toEqualTypeOf<TypedT<Res, 'a'>>();
    });

    it('adds plural base keys', () => {
        expectTypeOf<Parameters<TypedT<Res, 'b'>>[0]>().toEqualTypeOf<'w' | 'items' | 'items_one' | 'items_other' | 'deep_name' | 'deep_name_few'>();
        expectTypeOf<PluralBase<'plain'>>().toEqualTypeOf<never>();
        expectTypeOf<PluralBase<'a_b_one'>>().toEqualTypeOf<'a_b'>();
    });
});
