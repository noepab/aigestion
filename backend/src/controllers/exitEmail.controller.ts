import { Router, Request, Response } from 'express';
import { getTemplates, renderTemplate } from '../services/exitEmail.service';
import { buildResponse } from '../common/response-builder';

const router = Router();

// GET /api/exit-templates - list template names
/**
 * @openapi
 * /exit-templates:
 *   get:
 *     summary: List exit email templates
 *     tags: [ExitEmail]
 *     responses:
 *       200:
 *         description: List of template names
 */
router.get('/', (req: Request, res: Response) => {
  const templates = getTemplates();
  const names = Object.keys(templates);
  const requestId = (req as any).requestId;
  return res.json(buildResponse({ templates: names }, 200, requestId));
});

// GET /api/exit-templates/:name - get raw template (placeholders intact)
/**
 * @openapi
 * /exit-templates/{name}:
 *   get:
 *     summary: Get raw exit email template
 *     tags: [ExitEmail]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template content
 *       404:
 *         description: Template not found
 */
router.get('/:name', (req: Request, res: Response) => {
  const { name } = req.params;
  try {
    const content = renderTemplate(name, {}); // no data replacement
    const requestId = (req as any).requestId;
    return res.json(buildResponse({ content }, 200, requestId));
  } catch (err) {
    const requestId = (req as any).requestId;
    return res.status(404).json(buildResponse({ error: (err as Error).message }, 404, requestId));
  }
});

export default router;
