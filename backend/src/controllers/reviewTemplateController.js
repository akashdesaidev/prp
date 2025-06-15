import ReviewTemplate from '../models/ReviewTemplate.js';
import { validationResult } from 'express-validator';

// Get all question templates
export const getQuestionTemplates = async (req, res) => {
  try {
    const { category, type, usage } = req.query;

    const query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const templates = await ReviewTemplate.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ order: 1, createdAt: 1 });

    // Filter by usage if specified
    let filteredTemplates = templates;
    if (usage && usage !== 'all') {
      filteredTemplates = templates.filter((template) => template.usage[usage] === true);
    }

    // If no templates exist, provide default ones
    if (filteredTemplates.length === 0) {
      const defaultTemplates = ReviewTemplate.getDefaultTemplates();

      res.json({
        success: true,
        data: {
          templates: defaultTemplates,
          total: defaultTemplates.length,
          isDefault: true
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          templates: filteredTemplates,
          total: filteredTemplates.length,
          isDefault: false
        }
      });
    }
  } catch (error) {
    console.error('Error fetching question templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question templates',
      error: error.message
    });
  }
};

// Create new question template
export const createQuestionTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, category, text, type, required, order, usage } = req.body;

    const template = new ReviewTemplate({
      name,
      description,
      category,
      text,
      type,
      required: required !== undefined ? required : true,
      order: order || 0,
      usage: usage || {
        selfReview: true,
        peerReview: true,
        managerReview: true,
        upwardReview: false
      },
      createdBy: req.user.id
    });

    await template.save();

    await template.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Question template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Error creating question template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question template',
      error: error.message
    });
  }
};

// Update question template
export const updateQuestionTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const template = await ReviewTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Question template not found'
      });
    }

    const { name, description, category, text, type, required, order, usage, isActive } = req.body;

    // Update fields
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (category !== undefined) template.category = category;
    if (text !== undefined) template.text = text;
    if (type !== undefined) template.type = type;
    if (required !== undefined) template.required = required;
    if (order !== undefined) template.order = order;
    if (usage !== undefined) template.usage = usage;
    if (isActive !== undefined) template.isActive = isActive;

    template.updatedBy = req.user.id;

    await template.save();
    await template.populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Question template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Error updating question template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question template',
      error: error.message
    });
  }
};

// Delete question template (soft delete)
export const deleteQuestionTemplate = async (req, res) => {
  try {
    const template = await ReviewTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Question template not found'
      });
    }

    // Soft delete by setting isActive to false
    template.isActive = false;
    template.updatedBy = req.user.id;
    await template.save();

    res.json({
      success: true,
      message: 'Question template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question template',
      error: error.message
    });
  }
};

// Initialize default templates (one-time setup)
export const initializeDefaultTemplates = async (req, res) => {
  try {
    const existingCount = await ReviewTemplate.countDocuments({ isActive: true });

    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Templates already exist'
      });
    }

    const defaultTemplates = ReviewTemplate.getDefaultTemplates();
    const templateDocs = defaultTemplates.map((template) => ({
      ...template,
      createdBy: req.user.id,
      isActive: true
    }));

    const createdTemplates = await ReviewTemplate.insertMany(templateDocs);

    res.status(201).json({
      success: true,
      message: `${createdTemplates.length} default templates initialized`,
      data: createdTemplates
    });
  } catch (error) {
    console.error('Error initializing default templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize default templates',
      error: error.message
    });
  }
};

// Get template usage statistics
export const getTemplateStats = async (req, res) => {
  try {
    const stats = await ReviewTemplate.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalUsage: { $sum: '$usageCount' },
          avgUsage: { $avg: '$usageCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalTemplates = await ReviewTemplate.countDocuments({ isActive: true });
    const mostUsed = await ReviewTemplate.find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(5)
      .select('name text usageCount category');

    res.json({
      success: true,
      data: {
        categoryStats: stats,
        totalTemplates,
        mostUsedTemplates: mostUsed
      }
    });
  } catch (error) {
    console.error('Error fetching template stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template statistics',
      error: error.message
    });
  }
};
