import { z } from 'zod'

export const PresetSchema = z.enum(['admin', 'website', 'tool'])
export const DeliveryTierSchema = z.enum(['demo', 'business', 'commercial'])
export const DocumentTypeSchema = z.enum([
  'prd', 'ux', 'technical', 'database', 'api', 'development', 'test', 'release', 'changelog',
])
export const FieldTypeSchema = z.enum(['text', 'textarea', 'select', 'multiselect', 'checklist', 'table'])

export const DocumentFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: FieldTypeSchema,
  required: z.boolean(),
  group: z.string().optional(),
  help: z.string().optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  columns: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
})

export const DocumentDefinitionSchema = z.object({
  type: DocumentTypeSchema,
  title: z.string(),
  description: z.string(),
  fields: z.array(DocumentFieldSchema),
})

export const PresetDefinitionSchema = z.object({
  id: PresetSchema,
  name: z.string(),
  description: z.string(),
})

export const WorkspaceSettingsSchema = z.object({
  outputRoot: z.string(),
  updatedAt: z.string(),
})
export const WorkspaceSettingsUpdateSchema = z.object({ outputRoot: z.string().min(1).max(1000) })

export const ProjectCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  presets: z.array(PresetSchema).min(1).max(3),
  summary: z.string().trim().min(10).max(1000),
  deliveryTier: DeliveryTierSchema,
  targetUsers: z.string().trim().min(2).max(500),
  painPoints: z.string().trim().min(5).max(2000),
  successMetric: z.string().trim().min(3).max(500),
  mustHave: z.array(z.string().trim().min(1)).min(1).max(8),
  excluded: z.array(z.string().trim().min(1)).max(8).default([]),
  roles: z.array(z.string().trim().min(1)).min(1).max(12),
  dataSensitivity: z.enum(['none', 'normal', 'personal', 'sensitive']),
  devices: z.array(z.string()).min(1),
  expectedScale: z.string().trim().min(1).max(500),
  integrations: z.array(z.string().trim().min(1)).max(12).default([]),
})

export const ProjectUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  summary: z.string().trim().min(10).max(1000).optional(),
  status: z.enum(['draft', 'ready', 'generated']).optional(),
})

export const WorkspaceSchema = z.object({
  id: z.string(), name: z.string(), slug: z.string(), presets: z.array(PresetSchema),
  summary: z.string(), deliveryTier: DeliveryTierSchema,
  status: z.enum(['draft', 'ready', 'generated']), completeness: z.number().int(),
  createdAt: z.string(), updatedAt: z.string(),
})
export const ProjectSchema = WorkspaceSchema

export const DocumentContentSchema = z.record(z.unknown())
export const WorkspaceDocumentSchema = z.object({
  id: z.string(), projectId: z.string(), type: DocumentTypeSchema,
  content: DocumentContentSchema, completeness: z.number().int(),
  markdown: z.string(), updatedAt: z.string(),
})
export const DocumentUpdateSchema = z.object({
  content: DocumentContentSchema.optional(),
  markdown: z.string().max(500_000).optional(),
}).refine((input) => input.content !== undefined || input.markdown !== undefined, {
  message: 'Provide content or markdown',
})

export const ReadinessSchema = z.object({
  ready: z.boolean(), completeness: z.number().int(),
  missing: z.array(z.object({ documentType: DocumentTypeSchema, fieldId: z.string(), label: z.string() })),
  targetPath: z.string(), suggestedDirectoryName: z.string(),
})

export const TodoCategorySchema = z.enum(['planning', 'data', 'api', 'frontend', 'engineering', 'quality', 'release'])
export const TodoItemSchema = z.object({ id: z.string(), category: TodoCategorySchema, title: z.string(), detail: z.string(), acceptance: z.string(), sourceDocument: z.string(), sourceField: z.string() })
export const TodoGroupSchema = z.object({ category: TodoCategorySchema, title: z.string(), items: z.array(TodoItemSchema) })
export const TodoListSchema = z.object({ ready: z.boolean(), completeness: z.number().int(), missing: ReadinessSchema.shape.missing, groups: z.array(TodoGroupSchema), total: z.number().int(), markdown: z.string() })

export const GenerationSchema = z.object({
  id: z.string(), projectId: z.string(), targetPath: z.string(), presets: z.array(PresetSchema),
  status: z.enum(['success', 'failed']), commitHash: z.string().nullable(),
  errorMessage: z.string().nullable(), createdAt: z.string(),
})
export const GenerateInputSchema = z.object({ directoryName: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional() })

export const CodingAgentIdSchema = z.enum(['codex', 'claude'])
export const CodingAgentSchema = z.object({
  id: CodingAgentIdSchema,
  name: z.string(),
  available: z.boolean(),
  version: z.string().nullable(),
  path: z.string().nullable(),
})
export const InterviewMessageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(8000) })
export const DocumentPatchSchema = z.object({ documentType: DocumentTypeSchema, fields: z.record(z.unknown()) })
export const InterviewInputSchema = z.object({
  agentId: CodingAgentIdSchema,
  message: z.string().trim().min(1).max(8000),
  history: z.array(InterviewMessageSchema).max(30).default([]),
  workingDocument: z.string().max(30000).default(''),
})
export const InterviewResponseSchema = z.object({
  reply: z.string(),
  questions: z.array(z.string()).max(3),
  patches: z.array(DocumentPatchSchema),
  workingDocument: z.string().max(30000).default(''),
})
export const ProjectInterviewDraftSchema = z.object({
  name: z.string().max(100).optional(), slug: z.string().max(100).optional(),
  presets: z.array(PresetSchema).max(3).optional(), summary: z.string().max(1000).optional(),
  deliveryTier: DeliveryTierSchema.optional(), targetUsers: z.string().max(500).optional(),
  painPoints: z.string().max(2000).optional(), successMetric: z.string().max(500).optional(),
  mustHave: z.array(z.string()).max(8).optional(), excluded: z.array(z.string()).max(8).optional(),
  roles: z.array(z.string()).max(12).optional(), dataSensitivity: z.enum(['none', 'normal', 'personal', 'sensitive']).optional(),
  devices: z.array(z.string()).optional(), expectedScale: z.string().max(500).optional(), integrations: z.array(z.string()).max(12).optional(),
})
export const ProjectInterviewInputSchema = InterviewInputSchema.extend({ draft: ProjectInterviewDraftSchema.default({}) })
export const ProjectInterviewResponseSchema = z.object({ reply: z.string(), questions: z.array(z.string()).max(3), projectDraft: ProjectInterviewDraftSchema, workingDocument: z.string().max(30000).default('') })

export const IdParamSchema = z.object({ id: z.string().min(1) })
export const DocumentParamSchema = z.object({ id: z.string().min(1), type: DocumentTypeSchema })

export const BootstrapSchema = z.object({
  presets: z.array(PresetDefinitionSchema),
  documentDefinitions: z.array(DocumentDefinitionSchema),
  settings: WorkspaceSettingsSchema,
})

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>
export type DocumentUpdateInput = z.infer<typeof DocumentUpdateSchema>
export type DocumentType = z.infer<typeof DocumentTypeSchema>
export type Preset = z.infer<typeof PresetSchema>
export type GenerateInput = z.infer<typeof GenerateInputSchema>
export type CodingAgentId = z.infer<typeof CodingAgentIdSchema>
export type InterviewInput = z.infer<typeof InterviewInputSchema>
export type ProjectInterviewInput = z.infer<typeof ProjectInterviewInputSchema>
export type TodoItem = z.infer<typeof TodoItemSchema>
export type TodoGroup = z.infer<typeof TodoGroupSchema>
