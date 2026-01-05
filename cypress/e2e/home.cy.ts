describe('Home', () => {
  it('should display welcome text', () => {
    cy.visit('/');
    cy.contains('Bienvenido').should('exist');
  });
});
