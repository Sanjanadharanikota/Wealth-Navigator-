import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  X,
  ArrowLeft,
  Sparkles,
  PiggyBank,
  ShoppingCart,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { goalsAPI } from '../utils/api';

interface Goal {
  _id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  category: 'savings' | 'purchase' | 'debt' | 'investment' | 'emergency' | 'other';
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  currency: string;
  monthlyContribution?: number;
  progress: number;
  remaining: number;
  estimatedCompletion?: string;
  aiTip?: string;
  createdAt: string;
  updatedAt: string;
}

export default function GoalsPage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [contributionAmount, setContributionAmount] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    category: 'savings' as Goal['category'],
    deadline: '',
    priority: 'medium' as Goal['priority'],
    monthlyContribution: '',
  });

  useEffect(() => {
    loadGoals();
  }, [filterStatus]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsAPI.getGoals(filterStatus);
      setGoals(response.data.goals || []);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await goalsAPI.createGoal({
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: formData.currentAmount ? parseFloat(formData.currentAmount) : 0,
        monthlyContribution: formData.monthlyContribution ? parseFloat(formData.monthlyContribution) : undefined,
      });
      setShowCreateModal(false);
      resetForm();
      loadGoals();
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    try {
      await goalsAPI.updateGoal(selectedGoal._id, {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: formData.currentAmount ? parseFloat(formData.currentAmount) : 0,
        monthlyContribution: formData.monthlyContribution ? parseFloat(formData.monthlyContribution) : undefined,
      });
      setShowEditModal(false);
      setSelectedGoal(null);
      resetForm();
      loadGoals();
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;

    try {
      await goalsAPI.deleteGoal(selectedGoal._id);
      setShowDeleteModal(false);
      setSelectedGoal(null);
      loadGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contributionAmount) return;

    try {
      await goalsAPI.contribute(selectedGoal._id, parseFloat(contributionAmount));
      setShowContributeModal(false);
      setSelectedGoal(null);
      setContributionAmount('');
      loadGoals();
    } catch (error) {
      console.error('Failed to add contribution:', error);
    }
  };

  const openEditModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || '',
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      category: goal.category,
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      priority: goal.priority,
      monthlyContribution: goal.monthlyContribution?.toString() || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDeleteModal(true);
  };

  const openContributeModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowContributeModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      targetAmount: '',
      currentAmount: '',
      category: 'savings',
      deadline: '',
      priority: 'medium',
      monthlyContribution: '',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'savings':
        return <PiggyBank className="w-5 h-5" />;
      case 'purchase':
        return <ShoppingCart className="w-5 h-5" />;
      case 'debt':
        return <TrendingDown className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      case 'emergency':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'active':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'paused':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Financial Goals</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['active', 'completed', 'paused', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-white text-primary-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Content - Will be continued in next file */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            {/* Main empty state card */}
            <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-dark-700 text-center max-w-md w-full">
              {/* Animated illustration */}
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                  <Target className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                  {/* Animated background elements */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-transparent animate-pulse"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                </div>

                {/* Floating elements */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-60 animate-pulse"></div>
                </div>
                <div className="absolute bottom-0 left-1/4 transform -translate-x-1/2 translate-y-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>

              {/* Text content */}
              <h3 className="text-2xl font-bold dark:text-white mb-3">
                No {filterStatus} goals yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {filterStatus === 'active'
                  ? "Start your journey towards financial success! Create your first goal and watch your dreams turn into reality."
                  : `You don't have any ${filterStatus} goals. ${filterStatus === 'completed' ? 'Complete some active goals to see them here!' : 'Create new goals to get started!'}`
                }
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Track progress</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Set targets</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Get AI insights</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Stay motivated</span>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Create Your First Goal
              </button>

              {/* Motivational quote */}
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-dark-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  "The journey of a thousand miles begins with a single step."
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  — Lao Tzu
                </p>
              </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-primary-200/30 to-transparent rounded-full blur-xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full blur-xl"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div
                key={goal._id}
                className="group relative bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-dark-700 hover:border-primary-200 dark:hover:border-primary-700"
              >
                {/* Background gradient for completed goals */}
                {goal.status === 'completed' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl"></div>
                )}

                <div className="relative">
                  {/* Header with icon and title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all group-hover:scale-105 ${
                        goal.category === 'savings' ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-600 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-400' :
                        goal.category === 'purchase' ? 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-400' :
                        goal.category === 'debt' ? 'bg-gradient-to-br from-red-100 to-red-200 text-red-600 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-400' :
                        goal.category === 'investment' ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-400' :
                        goal.category === 'emergency' ? 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 dark:from-orange-900/30 dark:to-orange-800/30 dark:text-orange-400' :
                        'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 dark:from-gray-900/30 dark:to-gray-800/30 dark:text-gray-400'
                      }`}>
                        {getCategoryIcon(goal.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-xl dark:text-white leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {goal.name}
                          </h3>
                          <div className="flex items-center gap-1 ml-2">
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getPriorityColor(goal.priority)}`}>
                              {goal.priority}
                            </span>
                          </div>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {goal.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(goal.status)}`}>
                            {goal.status}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400">
                            {goal.category}
                          </span>
                          {goal.deadline && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(goal.deadline)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => openEditModal(goal)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(goal)}
                        className="p-2 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold dark:text-white">Progress</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {Math.round(goal.progress)}%
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(goal.currentAmount, goal.currency)} / {formatCurrency(goal.targetAmount, goal.currency)}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-4 rounded-full transition-all duration-1000 ease-out relative ${
                            goal.status === 'completed'
                              ? 'bg-gradient-to-r from-green-400 to-green-600'
                              : 'bg-gradient-to-r from-primary-400 to-primary-600'
                          }`}
                          style={{ width: `${Math.min(goal.progress, 100)}%` }}
                        >
                          {/* Progress glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                      {/* Milestone markers */}
                      {[25, 50, 75].map((milestone) => (
                        <div
                          key={milestone}
                          className={`absolute top-0 w-1 h-4 bg-white/80 rounded-full transform -translate-x-0.5`}
                          style={{ left: `${milestone}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Amount Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Amount</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(goal.currentAmount, goal.currency)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Target Amount</p>
                      <p className="text-xl font-bold dark:text-white">
                        {formatCurrency(goal.targetAmount, goal.currency)}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(goal.remaining, goal.currency)}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Goal</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {goal.monthlyContribution
                          ? formatCurrency(goal.monthlyContribution, goal.currency)
                          : 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* AI Tip */}
                  {goal.aiTip && (
                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-6 border border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                          {goal.aiTip}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Section */}
                  <div className="flex gap-3">
                    {goal.status === 'active' && goal.progress < 100 && (
                      <button
                        onClick={() => openContributeModal(goal)}
                        className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <DollarSign className="w-4 h-4" />
                        Add Contribution
                      </button>
                    )}

                    {goal.status === 'completed' && (
                      <div className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Goal Completed! 🎉
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals will be added here */}
      {/* Create/Edit/Delete/Contribute Modals */}
      {showCreateModal && <CreateGoalModal onClose={() => { setShowCreateModal(false); resetForm(); }} onSubmit={handleCreateGoal} formData={formData} setFormData={setFormData} />}
      {showEditModal && <EditGoalModal onClose={() => { setShowEditModal(false); setSelectedGoal(null); resetForm(); }} onSubmit={handleUpdateGoal} formData={formData} setFormData={setFormData} />}
      {showDeleteModal && selectedGoal && <DeleteGoalModal goal={selectedGoal} onClose={() => { setShowDeleteModal(false); setSelectedGoal(null); }} onConfirm={handleDeleteGoal} />}
      {showContributeModal && selectedGoal && <ContributeModal goal={selectedGoal} amount={contributionAmount} setAmount={setContributionAmount} onClose={() => { setShowContributeModal(false); setSelectedGoal(null); setContributionAmount(''); }} onSubmit={handleContribute} />}
    </div>
  );
}

// Modal Components
function CreateGoalModal({ onClose, onSubmit, formData, setFormData }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white">Create New Goal</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Set your financial target and start tracking progress</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-2xl transition-all duration-200 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-8 space-y-6">
          {/* Goal Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold dark:text-white">
              Goal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Emergency Fund, Vacation, New Car"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold dark:text-white">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="What is this goal for? (Optional)"
            />
          </div>

          {/* Amount Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">
                Target Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="50,000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">Current Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="savings">💰 Savings</option>
                <option value="purchase">🛒 Purchase</option>
                <option value="debt">📉 Debt Payoff</option>
                <option value="investment">📈 Investment</option>
                <option value="emergency">🚨 Emergency Fund</option>
                <option value="other">🎯 Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>
          </div>

          {/* Deadline and Monthly Contribution */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">Target Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">Monthly Contribution</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyContribution}
                  onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="5,000"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-dark-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditGoalModal({ onClose, onSubmit, formData, setFormData }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center">
              <Edit2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white">Edit Goal</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your goal details and targets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-2xl transition-all duration-200 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </button>
        </div>

        {/* Form - Same as Create modal */}
        <form onSubmit={onSubmit} className="p-8 space-y-6">
          {/* Goal Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold dark:text-white">
              Goal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Emergency Fund, Vacation, New Car"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold dark:text-white">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="What is this goal for? (Optional)"
            />
          </div>

          {/* Amount Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">
                Target Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="50,000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">Current Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="savings">💰 Savings</option>
                <option value="purchase">🛒 Purchase</option>
                <option value="debt">📉 Debt Payoff</option>
                <option value="investment">📈 Investment</option>
                <option value="emergency">🚨 Emergency Fund</option>
                <option value="other">🎯 Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>
          </div>

          {/* Deadline and Monthly Contribution */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">Target Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">Monthly Contribution</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyContribution}
                  onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="5,000"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-dark-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Update Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteGoalModal({ goal, onClose, onConfirm }: any) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'savings':
        return <PiggyBank className="w-5 h-5" />;
      case 'purchase':
        return <ShoppingCart className="w-5 h-5" />;
      case 'debt':
        return <TrendingDown className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      case 'emergency':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'active':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'paused':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-700 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white">Delete Goal</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-2xl transition-all duration-200 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 mb-6 border border-red-100 dark:border-red-800/30">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                goal.category === 'savings' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                goal.category === 'purchase' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                goal.category === 'debt' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                goal.category === 'investment' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                goal.category === 'emergency' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {getCategoryIcon(goal.category)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg dark:text-white mb-2">{goal.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {goal.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-1 rounded-full ${getPriorityColor(goal.priority)}`}>
                    {goal.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center leading-relaxed">
            Are you sure you want to delete this goal? This will permanently remove all progress and data associated with it.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Goal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContributeModal({ goal, amount, setAmount, onClose, onSubmit }: any) {
  const formatCurrency = (amt: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amt);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'savings':
        return <PiggyBank className="w-5 h-5" />;
      case 'purchase':
        return <ShoppingCart className="w-5 h-5" />;
      case 'debt':
        return <TrendingDown className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      case 'emergency':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-700 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-6 border-b border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white">Add Contribution</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your progress towards this goal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-2xl transition-all duration-200 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </button>
        </div>

        {/* Goal Overview */}
        <div className="p-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 mb-6 border border-green-100 dark:border-green-800/30">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                goal.category === 'savings' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                goal.category === 'purchase' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                goal.category === 'debt' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                goal.category === 'investment' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                goal.category === 'emergency' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {getCategoryIcon(goal.category)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg dark:text-white mb-2">{goal.name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Progress</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {Math.round(goal.progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-3 mb-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Current:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400 ml-1">
                      {formatCurrency(goal.currentAmount, goal.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Target:</span>
                    <span className="font-semibold dark:text-white ml-1">
                      {formatCurrency(goal.targetAmount, goal.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contribution Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold dark:text-white">
                Contribution Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter amount to contribute"
                  autoFocus
                />
              </div>
              {amount && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800/30">
                  <div className="flex items-center justify-between">
                    <span>New Total:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(goal.currentAmount + parseFloat(amount), goal.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Progress:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {Math.round(((goal.currentAmount + parseFloat(amount)) / goal.targetAmount) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-dark-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Add Contribution
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
