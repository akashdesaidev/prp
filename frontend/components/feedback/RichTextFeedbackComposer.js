'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  List,
  Quote,
  Type,
  Smile,
  Sparkles,
  Save,
  Eye,
  EyeOff,
  ChevronDown,
  User,
  Target,
  TrendingUp,
  Heart,
  Lightbulb,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function RichTextFeedbackComposer({
  initialContent = '',
  placeholder = 'Share your feedback...',
  minLength = 10,
  maxLength = 2000,
  enableTemplates = true,
  enableAI = true,
  onContentChange,
  onSave,
  autoSave = true,
  recipientData = null
}) {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState('saved');
  const [validationError, setValidationError] = useState('');

  const textareaRef = useRef(null);
  const autosaveTimeoutRef = useRef(null);

  // Feedback templates for different scenarios
  const feedbackTemplates = [
    {
      id: 'positive-performance',
      title: 'Positive Performance',
      icon: TrendingUp,
      color: 'text-green-600',
      template: `I wanted to recognize [Name] for their exceptional work on [Project/Task]. 

**What they did well:**
- [Specific achievement or behavior]
- [Impact on team/project]

**Why this matters:**
[Explain the positive impact]

**Going forward:**
I'd love to see more of this approach, especially in [specific area].`
    },
    {
      id: 'constructive-feedback',
      title: 'Constructive Feedback',
      icon: Target,
      color: 'text-blue-600',
      template: `I'd like to share some thoughts on [specific situation/project] to help with growth and development.

**What I observed:**
[Specific, objective description]

**Suggested improvements:**
- [Actionable suggestion 1]
- [Actionable suggestion 2]

**Support offered:**
I'm here to help with [specific support]. Let's schedule time to discuss this further.

**Strengths to build on:**
[Mention existing strengths that can help with improvement]`
    },
    {
      id: 'peer-collaboration',
      title: 'Peer Collaboration',
      icon: User,
      color: 'text-purple-600',
      template: `Working with [Name] on [project] has been [positive experience].

**Collaboration highlights:**
- [Communication style]
- [Problem-solving approach]
- [Team contribution]

**Impact on work:**
[How their collaboration affected outcomes]

**Suggestions for future work:**
[Ideas for continued collaboration or improvement]`
    }
  ];

  // Emoji shortcuts for feedback
  const emojiShortcuts = [
    { emoji: '👏', name: 'Great job' },
    { emoji: '🚀', name: 'Impressive' },
    { emoji: '💡', name: 'Great idea' },
    { emoji: '🎯', name: 'On target' },
    { emoji: '⭐', name: 'Excellent' },
    { emoji: '🔥', name: 'Amazing' },
    { emoji: '💪', name: 'Strong work' },
    { emoji: '🙌', name: 'Celebrate' },
    { emoji: '❤️', name: 'Appreciate' },
    { emoji: '🤝', name: 'Collaboration' },
    { emoji: '🌟', name: 'Outstanding' },
    { emoji: '✨', name: 'Brilliant' }
  ];

  useEffect(() => {
    updateWordCount(content);
    if (onContentChange) {
      onContentChange(content);
    }

    // Auto-save functionality
    if (autoSave && content.trim().length > 0) {
      setAutosaveStatus('typing');

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000);
    }

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [content]);

  const updateWordCount = (text) => {
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  const handleAutoSave = async () => {
    try {
      setAutosaveStatus('saving');
      if (onSave) {
        await onSave(content, { isDraft: true });
      }
      setAutosaveStatus('saved');
    } catch (error) {
      setAutosaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  };

  const insertText = (before, after = '') => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const newText =
      content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const applyTemplate = (template) => {
    let templateContent = template.template;

    // Replace placeholders with recipient data if available
    if (recipientData) {
      templateContent = templateContent.replace(
        /\[Name\]/g,
        `${recipientData.firstName} ${recipientData.lastName}`
      );
    }

    setContent(templateContent);
    setSelectedTemplate(template);
    setShowTemplates(false);
    setIsExpanded(true);

    // Focus the textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + emoji + content.substring(start);
    setContent(newContent);
    setShowEmojiPicker(false);

    // Restore cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleAISuggestion = async () => {
    try {
      const context = {
        recipientData,
        currentContent: content,
        feedbackType: 'general'
      };

      const response = await api.post('/ai/feedback-suggestion', context);
      const suggestion = response.data.suggestion;

      if (suggestion) {
        setContent(content + (content ? '\n\n' : '') + suggestion);
        toast.success('AI suggestion added');
      }
    } catch (error) {
      toast.error('Failed to get AI suggestion');
      console.error('AI suggestion error:', error);
    }
  };

  const validateContent = () => {
    const trimmedContent = content.trim();

    if (trimmedContent.length < minLength) {
      setValidationError(`Feedback must be at least ${minLength} characters long`);
      return false;
    }

    if (trimmedContent.length > maxLength) {
      setValidationError(`Feedback must be less than ${maxLength} characters`);
      return false;
    }

    setValidationError('');
    return true;
  };

  const formatPreviewContent = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n/g, '<br/>');
  };

  const getCharacterCountColor = () => {
    const ratio = content.length / maxLength;
    if (ratio > 0.9) return 'text-red-500';
    if (ratio > 0.7) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getAutosaveStatus = () => {
    switch (autosaveStatus) {
      case 'typing':
        return { icon: Type, color: 'text-gray-400', text: 'Typing...' };
      case 'saving':
        return { icon: Save, color: 'text-blue-500', text: 'Saving...' };
      case 'saved':
        return { icon: Check, color: 'text-green-500', text: 'Saved' };
      case 'error':
        return { icon: X, color: 'text-red-500', text: 'Save failed' };
      default:
        return null;
    }
  };

  const statusInfo = getAutosaveStatus();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header with Templates */}
      {enableTemplates && (
        <div className="border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <Type className="w-4 h-4 mr-2" />
                Templates
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform ${showTemplates ? 'rotate-180' : ''}`}
                />
              </Button>

              {selectedTemplate && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Using: {selectedTemplate.title}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {autoSave && statusInfo && (
                <div className="flex items-center space-x-1">
                  <statusInfo.icon className={`w-3 h-3 ${statusInfo.color}`} />
                  <span>{statusInfo.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Template Selection */}
          {showTemplates && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {feedbackTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="flex items-center space-x-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Icon className={`w-5 h-5 ${template.color}`} />
                    <div>
                      <div className="font-medium text-sm text-gray-900">{template.title}</div>
                      <div className="text-xs text-gray-500">
                        {template.template.substring(0, 50)}...
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Formatting buttons */}
            <button
              type="button"
              onClick={() => insertText('**', '**')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertText('*', '*')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertText('- ', '')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="List item"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => insertText('> ', '')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-gray-300"></div>

            {/* Emoji picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Emojis"
              >
                <Smile className="w-4 h-4" />
              </button>

              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                  <div className="grid grid-cols-6 gap-2">
                    {emojiShortcuts.map((item) => (
                      <button
                        key={item.emoji}
                        type="button"
                        onClick={() => insertEmoji(item.emoji)}
                        className="p-2 hover:bg-gray-100 rounded text-lg"
                        title={item.name}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Suggestions */}
            {enableAI && (
              <>
                <div className="w-px h-4 bg-gray-300"></div>
                <button
                  type="button"
                  onClick={handleAISuggestion}
                  className="flex items-center space-x-1 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="AI Suggestion"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs">AI</span>
                </button>
              </>
            )}
          </div>

          {/* Preview toggle */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center space-x-1 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-xs">{isPreview ? 'Edit' : 'Preview'}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        {isPreview ? (
          <div
            className="p-4 min-h-[200px] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formatPreviewContent(content) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={validateContent}
            placeholder={placeholder}
            className={`w-full p-4 border-0 resize-none focus:outline-none ${
              isExpanded ? 'min-h-[300px]' : 'min-h-[200px]'
            }`}
            onClick={() => setIsExpanded(true)}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Words: {wordCount}</span>
            <span className={getCharacterCountColor()}>
              Characters: {content.length}/{maxLength}
            </span>
            {validationError && <span className="text-red-500">{validationError}</span>}
          </div>

          <div className="flex items-center space-x-2">
            {!isExpanded && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-blue-500 hover:text-blue-700"
              >
                Expand editor
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
