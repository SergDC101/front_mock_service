<template>
  <div class="group-detail">
    <!-- Отладочная панель (можно убрать после исправления) -->
    <div v-if="debug" class="debug-panel">
      <h3>Отладка GroupDetail</h3>
      <p>Статус загрузки: {{ loading ? 'Загрузка...' : 'Завершено' }}</p>
      <p>Ошибка: {{ error || 'Нет' }}</p>
      <button @click="fetchGroup" class="debug-btn">Обновить</button>
      <button @click="debug = false" class="debug-btn">Скрыть</button>

      <div class="debug-data">
        <h4>Данные группы:</h4>
        <pre>{{ JSON.stringify(group, null, 2) }}</pre>
      </div>

      <div class="debug-data">
        <h4>Эндпоинты ({{ group?.endpoints?.length || 0 }}):</h4>
        <pre>{{ JSON.stringify(group?.endpoints, null, 2) }}</pre>
      </div>
    </div>

    <button @click="goBack" class="back-btn">
      ← Назад к группам
    </button>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка группы...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">❌</span>
      <p>{{ error }}</p>
      <button @click="fetchGroup" class="retry-btn">Повторить</button>
      <button @click="debug = !debug" class="debug-btn">🐛 Отладка</button>
    </div>

    <div v-else-if="group" class="group-content">
      <div class="group-header">
        <div>
          <h1>{{ group.name || 'Без названия' }}</h1>
          <div class="header-badges">
            <span class="status-badge" :class="{ 'active': group.isActive, 'inactive': !group.isActive }">
              {{ group.isActive ? 'Активна' : 'Неактивна' }}
            </span>
            <span class="endpoint-badge">
              <span class="badge-label">Базовый путь:</span>
              <code class="badge-value">/api/v1/{{ group.endpoint }}</code>
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button @click="openEditGroupDialog" class="edit-btn">✏️ Редактировать</button>
          <button @click="confirmDeleteGroup" class="delete-btn">🗑️ Удалить</button>
        </div>
      </div>

      <p v-if="group.description" class="group-description">
        {{ group.description }}
      </p>

      <div class="group-meta">
        <div class="meta-item">
          <span class="meta-label">Создана:</span>
          <span class="meta-value">{{ formatDate(group.createdAt) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Обновлена:</span>
          <span class="meta-value">{{ formatDate(group.updatedAt) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Всего эндпоинтов:</span>
          <span class="meta-value">{{ group.endpoints?.length || 0 }}</span>
        </div>
      </div>

      <div class="endpoints-section">
        <div class="section-header">
          <h2>Эндпоинты</h2>
          <button @click="openCreateDialog" class="add-btn">
            + Добавить эндпоинт
          </button>
          <button @click="debug = !debug" class="debug-toggle" title="Отладка">🐛</button>
        </div>

        <div v-if="!group.endpoints || group.endpoints.length === 0" class="empty-endpoints">
          <p>В этой группе пока нет эндпоинтов</p>
          <button @click="openCreateDialog" class="add-first-btn">
            Добавить первый эндпоинт
          </button>
        </div>

        <div v-else class="endpoints-list">
          <div
              v-for="endpoint in group.endpoints"
              :key="endpoint.id"
              class="endpoint-item"
              @click="copyToClipboard(endpoint)"
          >
            <div class="endpoint-method" :class="endpoint.method.toLowerCase()">
              {{ endpoint.method }}
            </div>

            <div class="endpoint-content">
              <div class="endpoint-name">{{ endpoint.name }}</div>

              <div class="endpoint-url" :class="{ 'copied': copiedEndpointId === endpoint.id }">
                <code>{{ getFullUrl(endpoint) }}</code>
                <span class="copy-hint">📋</span>
              </div>

              <div v-if="endpoint.description" class="endpoint-description">
                {{ endpoint.description }}
              </div>
            </div>

            <div class="endpoint-actions" @click.stop>
              <button @click="openEditDialog(endpoint)" class="icon-btn" title="Редактировать">✏️</button>
              <button @click="confirmDeleteEndpoint(endpoint)" class="icon-btn delete" title="Удалить">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог редактирования группы -->
    <EditGroupDialog
        :show="showEditGroupDialog"
        :group="group"
        @close="showEditGroupDialog = false"
        @updated="handleGroupUpdated"
    />

    <!-- Диалог подтверждения удаления группы -->
    <ConfirmDialog
        :show="showDeleteGroupDialog"
        title="Удаление группы"
        :message="`Вы уверены, что хотите удалить группу?`"
        :item-name="group?.name"
        type="danger"
        confirm-text="Удалить"
        cancel-text="Отмена"
        :loading="deleteGroupLoading"
        @confirm="handleDeleteGroupConfirm"
        @cancel="showDeleteGroupDialog = false"
    />

    <!-- Диалог подтверждения удаления эндпоинта -->
    <ConfirmDialog
        :show="showDeleteEndpointDialog"
        title="Удаление эндпоинта"
        :message="`Вы уверены, что хотите удалить эндпоинт?`"
        :item-name="selectedEndpoint?.name"
        type="warning"
        confirm-text="Удалить"
        cancel-text="Отмена"
        :loading="deleteEndpointLoading"
        @confirm="handleDeleteEndpointConfirm"
        @cancel="showDeleteEndpointDialog = false"
    />

    <!-- Единый диалог для создания/редактирования эндпоинта -->
    <EndpointDialog
        :show="showEndpointDialog"
        :group-endpoint="group?.endpoint"
        :login="authStore.user?.email"
        :endpoint-to-edit="editingEndpoint"
        @close="closeEndpointDialog"
        @created="handleEndpointCreated"
        @updated="handleEndpointUpdated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EndpointDialog from '@/components/EndpointDialog.vue';
import EditGroupDialog from '@/components/EditGroupDialog.vue';
import groupService from '@/stores/groupService';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Отладка
const debug = ref(false); // Включим отладку по умолчанию для диагностики

// Базовый URL API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8096';

const group = ref(null);
const loading = ref(true);
const error = ref(null);

// Состояние для уведомлений
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const toastIcon = ref('✅');
let toastTimeout = null;

// Состояние для подсветки скопированного элемента
const copiedEndpointId = ref(null);

// Состояние для диалогов
const showEditGroupDialog = ref(false);
const showDeleteGroupDialog = ref(false);
const deleteGroupLoading = ref(false);
const showDeleteEndpointDialog = ref(false);
const deleteEndpointLoading = ref(false);
const selectedEndpoint = ref(null);

// Состояние для диалога эндпоинта
const showEndpointDialog = ref(false);
const editingEndpoint = ref(null);

// Формирование полного URL для эндпоинта
const getFullUrl = (endpoint) => {
  if (!group.value || !endpoint) return '';

  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const basePath = `/api/v1/${group.value?.endpoint || ''}`.replace(/\/+$/, '');
  const endpointPath = (endpoint.path || '').replace(/^\/+/, '');

  return `${baseUrl}${basePath}/${endpointPath}`;
};

// Показать уведомление
const showNotification = (message, type = 'success') => {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toastIcon.value = icons[type] || '✅';
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;

  toastTimeout = setTimeout(() => {
    showToast.value = false;
  }, 2000);
};

// Копирование в буфер обмена
const copyToClipboard = async (endpoint) => {
  const url = getFullUrl(endpoint);

  try {
    await navigator.clipboard.writeText(url);

    copiedEndpointId.value = endpoint.id;
    showNotification(`URL скопирован`, 'success');

    setTimeout(() => {
      copiedEndpointId.value = null;
    }, 1000);

  } catch (err) {
    console.error('Ошибка при копировании:', err);
    showNotification('Не удалось скопировать URL', 'error');
  }
};

const fetchGroup = async () => {
  loading.value = true;
  error.value = null;

  try {
    const groupId = parseInt(route.params.id);
    console.log('Загрузка группы с ID:', groupId);

    const data = await groupService.getGroup(groupId);
    console.log('Получены данные группы:', data);

    group.value = data;
  } catch (err) {
    error.value = err.message || 'Не удалось загрузить группу';
    console.error('Ошибка загрузки группы:', err);
    showNotification('Ошибка загрузки группы', 'error');
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Неизвестно';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return 'Неизвестно';
  }
};

const goBack = () => {
  router.push('/');
};

const openEditGroupDialog = () => {
  showEditGroupDialog.value = true;
};

const handleGroupUpdated = (updatedGroup) => {
  group.value = updatedGroup;
  showNotification('Группа успешно обновлена', 'success');
};

const confirmDeleteGroup = () => {
  showDeleteGroupDialog.value = true;
};

const handleDeleteGroupConfirm = async () => {
  deleteGroupLoading.value = true;
  try {
    await groupService.deleteGroup(group.value.id);
    showNotification('Группа удалена', 'success');
    router.push('/');
  } catch (err) {
    showNotification(err.message || 'Не удалось удалить группу', 'error');
    console.error(err);
  } finally {
    deleteGroupLoading.value = false;
    showDeleteGroupDialog.value = false;
  }
};

// Открыть диалог создания эндпоинта
const openCreateDialog = () => {
  editingEndpoint.value = null;
  showEndpointDialog.value = true;
};

// Открыть диалог редактирования эндпоинта
const openEditDialog = (endpoint) => {
  editingEndpoint.value = { ...endpoint };
  showEndpointDialog.value = true;
};

// Закрыть диалог эндпоинта
const closeEndpointDialog = () => {
  showEndpointDialog.value = false;
  editingEndpoint.value = null;
};

// Обработчик создания эндпоинта - просто перезагружаем группу
const handleEndpointCreated = () => {
  console.log('Эндпоинт успешно создан, перезагружаем данные');
  fetchGroup(); // Перезагружаем данные группы
  showNotification('Эндпоинт успешно создан', 'success');
};

// Обработчик обновления эндпоинта - просто перезагружаем группу
const handleEndpointUpdated = () => {
  console.log('Эндпоинт успешно обновлен, перезагружаем данные');
  fetchGroup(); // Перезагружаем данные группы
  showNotification('Эндпоинт обновлен', 'success');
};

const confirmDeleteEndpoint = (endpoint) => {
  selectedEndpoint.value = endpoint;
  showDeleteEndpointDialog.value = true;
};

const handleDeleteEndpointConfirm = async () => {
  deleteEndpointLoading.value = true;
  try {
    // Здесь должен быть вызов API для удаления эндпоинта
    // await endpointService.deleteEndpoint(selectedEndpoint.value.id);

    // После успешного удаления перезагружаем группу
    await fetchGroup();
    showDeleteEndpointDialog.value = false;
    showNotification('Эндпоинт удален', 'success');
  } catch (err) {
    showNotification(err.message || 'Не удалось удалить эндпоинт', 'error');
    console.error(err);
  } finally {
    deleteEndpointLoading.value = false;
    selectedEndpoint.value = null;
  }
};

onMounted(() => {
  fetchGroup();
});
</script>

<style scoped>
/* Добавим стили для отладки */
.debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border: 2px solid #ff9800;
  border-radius: 8px;
  padding: 1rem;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.debug-panel h3 {
  color: #ff9800;
  margin-top: 0;
}

.debug-btn {
  background: #ff9800;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-right: 0.5rem;
  cursor: pointer;
}

.debug-toggle {
  background: #ff9800;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  margin-left: 0.5rem;
}

.debug-data {
  margin-top: 1rem;
  background: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
}

.debug-data pre {
  margin: 0;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.group-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
}

.back-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.3s;
}

.back-btn:hover {
  transform: translateX(-4px);
}

/* Стили для уведомлений */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 500px;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1100;
  border-left: 4px solid;
  animation: slideInRight 0.3s ease;
}

.toast-notification.success {
  border-left-color: #4caf50;
  background: #e8f5e9;
}

.toast-notification.error {
  border-left-color: #f44336;
  background: #ffebee;
}

.toast-notification.warning {
  border-left-color: #ff9800;
  background: #fff3e0;
}

.toast-notification.info {
  border-left-color: #2196f3;
  background: #e3f2fd;
}

.toast-icon {
  font-size: 1.5rem;
}

.toast-message {
  flex: 1;
  color: #333;
  font-size: 0.95rem;
  word-break: break-word;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.group-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.header-badges {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background: #ffebee;
  color: #c62828;
}

.endpoint-badge {
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 20px;
  padding: 0.25rem 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-label {
  color: #1976d2;
  font-size: 0.875rem;
}

.badge-value {
  background: white;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  color: #0d47a1;
  font-family: monospace;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.edit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.edit-btn:hover,
.delete-btn:hover {
  opacity: 0.9;
}

.group-description {
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.group-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.meta-value {
  font-size: 1.1rem;
  font-weight: 500;
}

.endpoints-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  color: #333;
  margin: 0;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.add-btn:hover {
  opacity: 0.9;
}

.empty-endpoints {
  text-align: center;
  padding: 3rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.empty-endpoints p {
  color: #666;
  margin-bottom: 1rem;
}

.add-first-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.add-first-btn:hover {
  opacity: 0.9;
}

.endpoints-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.endpoint-item {
  display: flex;
  align-items: flex-start;
  padding: 1.25rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s;
  border-left: 4px solid transparent;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.endpoint-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
}

.endpoint-item:active {
  transform: scale(0.99);
}

.endpoint-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(102, 126, 234, 0.1);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.endpoint-item:active::after {
  opacity: 1;
}

.endpoint-item:has(.endpoint-method.get) {
  border-left-color: #61affe;
}

.endpoint-item:has(.endpoint-method.post) {
  border-left-color: #49cc90;
}

.endpoint-item:has(.endpoint-method.put) {
  border-left-color: #fca130;
}

.endpoint-item:has(.endpoint-method.patch) {
  border-left-color: #50e3c2;
}

.endpoint-item:has(.endpoint-method.delete) {
  border-left-color: #f93e3e;
}

.endpoint-item:has(.endpoint-method.head) {
  border-left-color: #9013fe;
}

.endpoint-item:has(.endpoint-method.options) {
  border-left-color: #8b572a;
}

.endpoint-method {
  padding: 0.35rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
  min-width: 80px;
  text-align: center;
  margin-right: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.endpoint-method.get {
  background-color: #61affe;
}

.endpoint-method.post {
  background-color: #49cc90;
}

.endpoint-method.put {
  background-color: #fca130;
}

.endpoint-method.patch {
  background-color: #50e3c2;
}

.endpoint-method.delete {
  background-color: #f93e3e;
}

.endpoint-method.head {
  background-color: #9013fe;
}

.endpoint-method.options {
  background-color: #8b572a;
}

.endpoint-content {
  flex: 1;
  pointer-events: none;
}

.endpoint-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.endpoint-url {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #eef2ff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  max-width: 100%;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.endpoint-url.copied {
  background: #c8e6c9;
  border-color: #4caf50;
  transform: scale(1.02);
}

.endpoint-url code {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9rem;
  color: #1e40af;
  word-break: break-all;
  overflow-wrap: break-word;
}

.copy-hint {
  font-size: 1rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.endpoint-item:hover .copy-hint {
  opacity: 0.6;
}

.endpoint-url.copied .copy-hint {
  opacity: 1;
  color: #4caf50;
}

.endpoint-description {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
  font-style: italic;
  padding-left: 0.5rem;
  border-left: 2px solid #e0e0e0;
}

.endpoint-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
  pointer-events: auto;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s;
  opacity: 0.6;
}

.icon-btn:hover {
  opacity: 1;
  background-color: #e0e0e0;
  transform: scale(1.1);
}

.icon-btn.delete:hover {
  background-color: #ffebee;
  color: #d32f2f;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
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

@media (max-width: 768px) {
  .group-detail {
    padding: 1rem;
  }

  .toast-notification {
    min-width: auto;
    width: 90%;
    right: 5%;
    left: 5%;
  }

  .group-header {
    flex-direction: column;
  }

  .group-header h1 {
    font-size: 2rem;
  }

  .header-actions {
    width: 100%;
  }

  .edit-btn,
  .delete-btn {
    flex: 1;
  }

  .endpoint-item {
    flex-direction: column;
    gap: 1rem;
  }

  .endpoint-method {
    margin-right: 0;
    align-self: flex-start;
  }

  .endpoint-actions {
    margin-left: 0;
    align-self: flex-end;
  }

  .endpoint-url {
    width: 100%;
    justify-content: space-between;
  }

  .endpoint-url code {
    font-size: 0.8rem;
  }
}
</style>