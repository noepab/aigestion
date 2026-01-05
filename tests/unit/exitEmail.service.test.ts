import { getTemplates, renderTemplate } from '../../backend/src/services/exitEmail.service';

describe('ExitEmail Service', () => {
  test('getTemplates returns all templates', () => {
    const templates = getTemplates();
    expect(Object.keys(templates).length).toBeGreaterThanOrEqual(4);
    expect(templates).toHaveProperty('formal');
    expect(templates).toHaveProperty('friendly');
    expect(templates).toHaveProperty('brief');
    expect(templates).toHaveProperty('creative');
  });

  test('renderTemplate replaces placeholders', () => {
    const data = { nombre: 'Juan', jefe: 'María' };
    const output = renderTemplate('formal', data);
    expect(output).toContain('Juan');
    expect(output).toContain('María');
  });

  test('renderTemplate throws on missing template', () => {
    expect(() => renderTemplate('nonexistent', {})).toThrow();
  });
});
