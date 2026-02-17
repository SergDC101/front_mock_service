<template>
  <div class="home">
    <div class="home-header">
      <h1 class="page-title">Мои группы эндпоинтов</h1>
      <button @click="showCreateModal = true" class="create-btn">
        <span class="btn-icon">➕</span>
        Создать группу
      </button>
    </div>





    <!-- Статистика -->
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <span class="stat-value">{{ groups.length }}</span>
          <span class="stat-label">Всего групп</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-value">{{ activeGroupsCount }}</span>
          <span class="stat-label">Активных</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <span class="stat-value">{{ totalEndpointsCount }}</span>
          <span class="stat-label">Всего эндпоинтов</span>
        </div>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="filters">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по названию или описанию..."
            class="search-input"
        />
      </div>
      <select v-model="statusFilter" class="filter-select">
        <option value="all">Все группы</option>
        <option value="active">Только активные</option>
        <option value="inactive">Только неактивные</option>
      </select>
    </div>

    <!-- Состояния загрузки и ошибок -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка групп...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">❌</span>
      <p>{{ error }}</p>
      <button @click="fetchGroups" class="retry-btn">Повторить</button>
    </div>



    <!-- Сетка с группами -->
    <div v-else-if="filteredGroups.length > 0" class="groups-grid">
      <GroupCard
          v-for="group in filteredGroups"
          :key="group.id"
          :group="group"
          @toggle-status="handleToggleStatus"
          @edit="handleEditGroup"
          @delete="handleDeleteGroup"
          @view-details="handleViewDetails"
      />
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>Группы не найдены</h3>
      <p v-if="searchQuery || statusFilter !== 'all'">
        Попробуйте изменить параметры поиска
      </p>
      <p v-else>
        Создайте свою первую группу эндпоинтов
      </p>
      <button v-if="!searchQuery && statusFilter === 'all'" @click="showCreateModal = true" class="create-empty-btn">
        Создать группу
      </button>
    </div>

    <!-- Модальное окно создания/редактирования группы -->
    <Transition name="modal">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <h2>{{ editingGroup ? 'Редактировать группу' : 'Создать новую группу' }}</h2>

          <form @submit.prevent="handleSaveGroup" class="modal-form">
            <div class="form-group">
              <label for="groupName">Название группы *</label>
              <input
                  id="groupName"
                  v-model="groupForm.name"
                  type="text"
                  required
                  placeholder="Введите название группы"
                  :class="{ 'error': validationErrors.name }"
              />
              <div v-if="validationErrors.name" class="error-message">
                {{ validationErrors.name }}
              </div>
            </div>

            <!-- Новое поле для endpoint с валидацией -->
            <div class="form-group">
              <label for="groupEndpoint">Эндпоинт группы *</label>
              <div class="endpoint-input-wrapper">
                <span class="endpoint-prefix">/api/v1/</span>
                <input
                    id="groupEndpoint"
                    v-model="groupForm.endpoint"
                    type="text"
                    required
                    placeholder="users-api"
                    :class="{ 'error': validationErrors.endpoint }"
                    @input="validateEndpoint"
                    @keyup="validateEndpoint"
                />
              </div>
              <div class="endpoint-hint">
                Только латинские буквы, цифры и дефисы (пример: users-api, auth-service)
              </div>
              <div v-if="validationErrors.endpoint" class="error-message">
                {{ validationErrors.endpoint }}
              </div>
            </div>

            <div class="form-group">
              <label for="groupDescription">Описание</label>
              <textarea
                  id="groupDescription"
                  v-model="groupForm.description"
                  rows="3"
                  placeholder="Введите описание группы (необязательно)"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                    type="checkbox"
                    v-model="groupForm.isActive"
                />
                Активна
              </label>
            </div>

            <!-- Предпросмотр эндпоинта -->
            <div v-if="groupForm.endpoint && !validationErrors.endpoint" class="endpoint-preview">
              <span class="preview-label">Полный путь:</span>
              <code class="preview-value">/api/v1/{{ groupForm.endpoint }}</code>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal" class="cancel-btn">
                Отмена
              </button>
              <button type="submit" class="save-btn" :disabled="!isFormValid">
                {{ editingGroup ? 'Сохранить' : 'Создать' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import GroupCard from '@/components/GroupCard.vue';
import groupService from '@/services/groupService';

const authStore = useAuthStore();
const router = useRouter();

// Состояние
const groups = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const statusFilter = ref('all');
const showCreateModal = ref(false);
const editingGroup = ref(null);
const groupForm = ref({
  name: '',
  endpoint: '',
  description: '',
  isActive: true
});




// Валидация
const validationErrors = ref({
  name: '',
  endpoint: ''
});

// Регулярное выражение для валидации endpoint (только латиница, цифры и дефисы)
const endpointRegex = /^[a-zA-Z0-9\-]+$/;

// Валидация endpoint
const validateEndpoint = () => {
  const value = groupForm.value.endpoint;

  if (!value) {
    validationErrors.value.endpoint = 'Эндпоинт обязателен';
  } else if (!endpointRegex.test(value)) {
    validationErrors.value.endpoint = 'Только латинские буквы, цифры и дефисы';
  } else if (value.length < 3) {
    validationErrors.value.endpoint = 'Минимум 3 символа';
  } else if (value.length > 50) {
    validationErrors.value.endpoint = 'Максимум 50 символов';
  } else {
    validationErrors.value.endpoint = '';
  }
};

// Валидация названия
const validateName = () => {
  const value = groupForm.value.name;

  if (!value) {
    validationErrors.value.name = 'Название обязательно';
  } else if (value.length < 2) {
    validationErrors.value.name = 'Минимум 2 символа';
  } else if (value.length > 100) {
    validationErrors.value.name = 'Максимум 100 символов';
  } else {
    validationErrors.value.name = '';
  }
};

// Проверка валидности формы
const isFormValid = computed(() => {
  return groupForm.value.name &&
      groupForm.value.endpoint &&
      !validationErrors.value.name &&
      !validationErrors.value.endpoint;
});

// Следим за изменениями полей для валидации
watch(() => groupForm.value.name, validateName);
watch(() => groupForm.value.endpoint, validateEndpoint);

// Вычисляемые свойства
const activeGroupsCount = computed(() => {
  return groups.value.filter(g => g.isActive).length;
});

const totalEndpointsCount = computed(() => {
  return groups.value.reduce((total, group) => total + group.endpoints.length, 0);
});

const filteredGroups = computed(() => {
  return groups.value.filter(group => {
    // Поиск по тексту
    const matchesSearch = searchQuery.value === '' ||
        group.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        group.endpoint.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchQuery.value.toLowerCase()));

    // Фильтр по статусу
    const matchesStatus = statusFilter.value === 'all' ||
        (statusFilter.value === 'active' && group.isActive) ||
        (statusFilter.value === 'inactive' && !group.isActive);

    return matchesSearch && matchesStatus;
  });
});

// Методы
const fetchGroups = async () => {
  loading.value = true;
  error.value = null;

  try {
    groups.value = await groupService.getGroups();
  } catch (err) {
    error.value = 'Не удалось загрузить группы. Пожалуйста, попробуйте позже.';
    console.error('Ошибка загрузки групп:', err);
  } finally {
    loading.value = false;
  }
};

const handleToggleStatus = async (groupId) => {
  try {
    const updatedGroup = await groupService.toggleGroupStatus(groupId);
    const index = groups.value.findIndex(g => g.id === groupId);
    if (index !== -1) {
      groups.value[index] = updatedGroup;
    }
  } catch (err) {
    alert('Не удалось изменить статус группы');
    console.error(err);
  }
};

const handleEditGroup = (group) => {
  editingGroup.value = group;
  groupForm.value = {
    name: group.name,
    endpoint: group.endpoint,
    description: group.description || '',
    isActive: group.isActive
  };
  showCreateModal.value = true;

  // Запускаем валидацию
  validateName();
  validateEndpoint();
};

const handleDeleteGroup = async (groupId) => {
  try {
    await groupService.deleteGroup(groupId);
    groups.value = groups.value.filter(g => g.id !== groupId);
  } catch (err) {
    alert('Не удалось удалить группу');
    console.error(err);
  }
};

const handleViewDetails = (groupId) => {
  router.push(`/groups/${groupId}`);
};

const closeModal = () => {
  showCreateModal.value = false;
  editingGroup.value = null;
  groupForm.value = {
    name: '',
    endpoint: '',
    description: '',
    isActive: true
  };
  validationErrors.value = {
    name: '',
    endpoint: ''
  };
};

const handleSaveGroup = async () => {
  // Финальная валидация
  validateName();
  validateEndpoint();

  if (!isFormValid.value) {
    return;
  }

  try {
    if (editingGroup.value) {
      // Обновление существующей группы
      const updatedGroup = await groupService.updateGroup(editingGroup.value.id, groupForm.value);
      const index = groups.value.findIndex(g => g.id === editingGroup.value.id);
      if (index !== -1) {
        groups.value[index] = updatedGroup;
      }
    } else {
      // Создание новой группы
      const newGroup = await groupService.createGroup(groupForm.value);
      groups.value.push(newGroup);
    }
    closeModal();
  } catch (err) {
    alert('Не удалось сохранить группу');
    console.error(err);
  }
};

// Загрузка данных при монтировании компонента
onMounted(() => {
  fetchGroups();
});
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 2rem;
  color: #333;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.create-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.create-btn:hover {
  opacity: 0.9;
}

.btn-icon {
  font-size: 1.2rem;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  position: relative;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.filter-select {
  padding: 0.75rem 2rem 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.5rem;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state p {
  color: #d32f2f;
  margin-bottom: 1rem;
}

.retry-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.retry-btn:hover {
  opacity: 0.9;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.create-empty-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.create-empty-btn:hover {
  opacity: 0.9;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-content h2 {
  color: #333;
  margin-bottom: 1.5rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #555;
}

.form-group input[type="text"],
.form-group textarea {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input[type="text"]:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input[type="text"].error,
.form-group textarea.error {
  border-color: #f44336;
}

.error-message {
  color: #f44336;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.endpoint-input-wrapper {
  display: flex;
  align-items: center;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.endpoint-input-wrapper:focus-within {
  border-color: #667eea;
}

.endpoint-prefix {
  background: #f5f5f5;
  padding: 0.75rem;
  color: #666;
  font-family: monospace;
  border-right: 2px solid #e0e0e0;
  white-space: nowrap;
}

.endpoint-input-wrapper input {
  flex: 1;
  border: none !important;
  border-radius: 0 !important;
}

.endpoint-input-wrapper input:focus {
  outline: none;
}

.endpoint-hint {
  font-size: 0.8rem;
  color: #666;
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 4px;
}

.endpoint-preview {
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-label {
  color: #2e7d32;
  font-size: 0.9rem;
}

.preview-value {
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  color: #1b5e20;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background-color: #f5f5f5;
}

.save-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.save-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Анимация для модального окна */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .home {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .groups-grid {
    grid-template-columns: 1fr;
  }

  .stats-container {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .endpoint-input-wrapper {
    flex-direction: column;
  }

  .endpoint-prefix {
    width: 100%;
    text-align: center;
    border-right: none;
    border-bottom: 2px solid #e0e0e0;
  }
}
</style>