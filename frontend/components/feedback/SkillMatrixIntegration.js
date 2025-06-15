'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Tag,
  TrendingUp,
  Target,
  Award,
  Star,
  BarChart3,
  Filter,
  X,
  Check,
  Users,
  Brain,
  Zap,
  Shield,
  Heart,
  Code,
  MessageSquare,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function SkillMatrixIntegration({
  selectedSkills = [],
  onSkillsChange,
  feedbackType = 'general', // 'general', 'review', 'development'
  showAnalytics = false,
  compactMode = false
}) {
  const [skills, setSkills] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', category: '', description: '' });
  const [skillRatings, setSkillRatings] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Predefined skill categories with icons
  const defaultCategories = [
    { id: 'technical', name: 'Technical Skills', icon: Code, color: 'bg-blue-100 text-blue-800' },
    {
      id: 'communication',
      name: 'Communication',
      icon: MessageSquare,
      color: 'bg-green-100 text-green-800'
    },
    { id: 'leadership', name: 'Leadership', icon: Users, color: 'bg-purple-100 text-purple-800' },
    {
      id: 'problem-solving',
      name: 'Problem Solving',
      icon: Brain,
      color: 'bg-orange-100 text-orange-800'
    },
    { id: 'collaboration', name: 'Collaboration', icon: Heart, color: 'bg-red-100 text-red-800' },
    { id: 'innovation', name: 'Innovation', icon: Zap, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'reliability', name: 'Reliability', icon: Shield, color: 'bg-gray-100 text-gray-800' },
    {
      id: 'performance',
      name: 'Performance',
      icon: TrendingUp,
      color: 'bg-indigo-100 text-indigo-800'
    }
  ];

  // Suggested skills based on feedback type
  const skillSuggestions = {
    general: ['Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Adaptability'],
    review: ['Goal Achievement', 'Quality of Work', 'Initiative', 'Mentoring', 'Customer Focus'],
    development: [
      'Learning Agility',
      'Technical Growth',
      'Leadership Potential',
      'Innovation',
      'Strategic Thinking'
    ]
  };

  useEffect(() => {
    fetchSkills();
    fetchSkillCategories();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await api.get('/skills', {
        params: {
          search: searchTerm,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          limit: 100
        }
      });
      setSkills(response.data.skills || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
      // If skills API doesn't exist, use default skills
      setSkills(generateDefaultSkills());
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillCategories = async () => {
    try {
      const response = await api.get('/skills/categories');
      setSkillCategories(response.data.categories || defaultCategories);
    } catch (error) {
      console.error('Error fetching skill categories:', error);
      setSkillCategories(defaultCategories);
    }
  };

  const generateDefaultSkills = () => {
    return [
      // Technical Skills
      { _id: '1', name: 'JavaScript', category: 'technical', usage: 45, trending: true },
      { _id: '2', name: 'React', category: 'technical', usage: 38, trending: true },
      { _id: '3', name: 'Node.js', category: 'technical', usage: 32, trending: false },
      { _id: '4', name: 'Python', category: 'technical', usage: 28, trending: true },
      { _id: '5', name: 'Database Design', category: 'technical', usage: 25, trending: false },

      // Communication Skills
      {
        _id: '6',
        name: 'Written Communication',
        category: 'communication',
        usage: 52,
        trending: false
      },
      {
        _id: '7',
        name: 'Presentation Skills',
        category: 'communication',
        usage: 35,
        trending: false
      },
      { _id: '8', name: 'Active Listening', category: 'communication', usage: 41, trending: false },
      {
        _id: '9',
        name: 'Cross-functional Collaboration',
        category: 'communication',
        usage: 39,
        trending: true
      },

      // Leadership Skills
      { _id: '10', name: 'Team Leadership', category: 'leadership', usage: 22, trending: false },
      { _id: '11', name: 'Mentoring', category: 'leadership', usage: 18, trending: true },
      { _id: '12', name: 'Strategic Planning', category: 'leadership', usage: 15, trending: false },
      { _id: '13', name: 'Decision Making', category: 'leadership', usage: 31, trending: false },

      // Problem Solving
      {
        _id: '14',
        name: 'Analytical Thinking',
        category: 'problem-solving',
        usage: 44,
        trending: false
      },
      {
        _id: '15',
        name: 'Creative Problem Solving',
        category: 'problem-solving',
        usage: 33,
        trending: true
      },
      {
        _id: '16',
        name: 'Root Cause Analysis',
        category: 'problem-solving',
        usage: 27,
        trending: false
      },

      // Collaboration
      { _id: '17', name: 'Teamwork', category: 'collaboration', usage: 48, trending: false },
      {
        _id: '18',
        name: 'Conflict Resolution',
        category: 'collaboration',
        usage: 21,
        trending: false
      },
      {
        _id: '19',
        name: 'Stakeholder Management',
        category: 'collaboration',
        usage: 26,
        trending: true
      },

      // Innovation
      { _id: '20', name: 'Innovation', category: 'innovation', usage: 19, trending: true },
      {
        _id: '21',
        name: 'Process Improvement',
        category: 'innovation',
        usage: 24,
        trending: false
      },
      { _id: '22', name: 'Learning Agility', category: 'innovation', usage: 29, trending: true }
    ];
  };

  const handleSkillSelect = (skill) => {
    const isSelected = selectedSkills.some((s) => s._id === skill._id);
    let updatedSkills;

    if (isSelected) {
      updatedSkills = selectedSkills.filter((s) => s._id !== skill._id);
      // Remove rating
      const updatedRatings = { ...skillRatings };
      delete updatedRatings[skill._id];
      setSkillRatings(updatedRatings);
    } else {
      updatedSkills = [...selectedSkills, skill];
    }

    if (onSkillsChange) {
      onSkillsChange(updatedSkills);
    }
  };

  const handleSkillRating = (skillId, rating) => {
    setSkillRatings((prev) => ({
      ...prev,
      [skillId]: rating
    }));
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) {
      toast.error('Skill name is required');
      return;
    }

    try {
      const response = await api.post('/skills', newSkill);
      const createdSkill = response.data.skill;

      setSkills((prev) => [createdSkill, ...prev]);
      setNewSkill({ name: '', category: '', description: '' });
      setShowAddSkill(false);
      toast.success('Skill added successfully');
    } catch (error) {
      console.error('Error adding skill:', error);
      // Add to local state if API fails
      const tempSkill = {
        _id: Date.now().toString(),
        ...newSkill,
        usage: 1,
        trending: false
      };
      setSkills((prev) => [tempSkill, ...prev]);
      setNewSkill({ name: '', category: '', description: '' });
      setShowAddSkill(false);
      toast.success('Skill added locally');
    }
  };

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (categoryId) => {
    const category = skillCategories.find((cat) => cat.id === categoryId);
    return category ? category.icon : Tag;
  };

  const getCategoryColor = (categoryId) => {
    const category = skillCategories.find((cat) => cat.id === categoryId);
    return category ? category.color : 'bg-gray-100 text-gray-800';
  };

  const SkillRatingComponent = ({ skill }) => {
    const rating = skillRatings[skill._id] || 0;

    return (
      <div className="flex items-center space-x-2 mt-2">
        <span className="text-xs text-gray-500">Rate:</span>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleSkillRating(skill._id, star)}
              className="w-4 h-4 transition-colors"
            >
              <Star
                className={`w-full h-full ${
                  star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">{rating}/10</span>
      </div>
    );
  };

  if (compactMode) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Skills</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Suggestions
          </Button>
        </div>

        {showSuggestions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-900 mb-2">Suggested Skills</div>
            <div className="flex flex-wrap gap-2">
              {skillSuggestions[feedbackType]?.map((skillName) => (
                <button
                  key={skillName}
                  type="button"
                  onClick={() =>
                    handleSkillSelect({
                      _id: Date.now().toString(),
                      name: skillName,
                      category: 'general'
                    })
                  }
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                >
                  {skillName}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <div
              key={skill._id}
              className="flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1"
            >
              <span className="text-sm">{skill.name}</span>
              <button
                type="button"
                onClick={() => handleSkillSelect(skill)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Skills & Competencies</h3>
        {showAnalytics && (
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => setShowAddSkill(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Skills
          </button>
          {skillCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category.id
                  ? category.color
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading skills...</p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No skills found</p>
          </div>
        ) : (
          filteredSkills.map((skill) => {
            const isSelected = selectedSkills.some((s) => s._id === skill._id);
            const Icon = getCategoryIcon(skill.category);

            return (
              <div
                key={skill._id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleSkillSelect(skill)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{skill.name}</span>
                      {skill.trending && <TrendingUp className="w-3 h-3 text-green-500" />}
                    </div>

                    <div className="mt-1 flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(skill.category)}`}
                      >
                        {skillCategories.find((cat) => cat.id === skill.category)?.name ||
                          skill.category}
                      </span>
                      {skill.usage && (
                        <span className="text-xs text-gray-500">{skill.usage} uses</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <Check className="w-5 h-5 text-blue-600" />
                    ) : (
                      <div className="w-5 h-5 border border-gray-300 rounded"></div>
                    )}
                  </div>
                </div>

                {isSelected && <SkillRatingComponent skill={skill} />}
              </div>
            );
          })
        )}
      </div>

      {/* Selected Skills Summary */}
      {selectedSkills.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Selected Skills ({selectedSkills.length})
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (onSkillsChange) {
                  onSkillsChange([]);
                }
                setSkillRatings({});
              }}
            >
              Clear All
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <div
                key={skill._id}
                className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
              >
                <span className="text-sm">{skill.name}</span>
                {skillRatings[skill._id] && (
                  <span className="text-xs">({skillRatings[skill._id]}/10 ⭐)</span>
                )}
                <button
                  type="button"
                  onClick={() => handleSkillSelect(skill)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Add New Skill</h3>
              <button
                onClick={() => setShowAddSkill(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., React Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {skillCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newSkill.description}
                  onChange={(e) =>
                    setNewSkill((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of this skill..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowAddSkill(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddSkill}>
                Add Skill
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
