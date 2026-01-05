import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SharedHello } from './SharedHello';

describe('SharedHello', () => {
  it('renderiza el texto correctamente', () => {
    const { getByText } = render(<SharedHello />);
    expect(getByText('¡Hola desde shared/components/SharedHello!')).toBeDefined();
  });
});
