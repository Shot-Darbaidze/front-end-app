import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm Hook', () => {
  const mockValidators = {
    email: {
      required: 'Email is required',
      custom: (value: string) => {
        if (!value.includes('@')) return 'Invalid email';
        return null;
      },
    },
    password: {
      required: 'Password is required',
      minLength: { value: 8, message: 'Password too short' },
    },
  };

  it('should initialize form with default values', () => {
    const { result } = renderHook(() =>
      useForm({ email: '', password: '' }, jest.fn(), mockValidators)
    );

    expect(result.current.values.email).toBe('');
    expect(result.current.values.password).toBe('');
  });

  it('should update field value on change', async () => {
    const { result } = renderHook(() =>
      useForm({ email: '', password: '' }, jest.fn(), mockValidators)
    );

    await act(async () => {
      await result.current.handleChange({ target: { name: 'email', value: 'test@example.com' } } as any);
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('should validate field on blur', async () => {
    const { result } = renderHook(() =>
      useForm({ email: '', password: '' }, jest.fn(), mockValidators)
    );

    await act(async () => {
      await result.current.handleChange({ target: { name: 'email', value: 'invalid' } } as any);
    });

    await act(async () => {
      await result.current.handleBlur({ target: { name: 'email' } } as any);
    });

    expect(result.current.errors.email).toBe('Invalid email');
  });

  it('should reset form to initial values', async () => {
    const { result } = renderHook(() =>
      useForm({ email: '', password: '' }, jest.fn(), mockValidators)
    );

    await act(async () => {
      await result.current.handleChange({ target: { name: 'email', value: 'test@example.com' } } as any);
    });

    expect(result.current.values.email).toBe('test@example.com');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values.email).toBe('');
  });

  it('should track dirty state', async () => {
    const { result } = renderHook(() =>
      useForm({ email: '', password: '' }, jest.fn(), mockValidators)
    );

    expect(result.current.isDirty).toBe(false);

    await act(async () => {
      await result.current.handleChange({ target: { name: 'email', value: 'test@example.com' } } as any);
    });

    expect(result.current.isDirty).toBe(true);
  });
});
