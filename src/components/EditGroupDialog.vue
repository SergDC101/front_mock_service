<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="show" class="dialog-overlay" @click.self="handleClose">
        <div class="dialog-content">
          <div class="dialog-header">
            <h2>Редактирование группы</h2>
            <button @click="handleClose" class="close-btn" :disabled="loading">✕</button>
          </div>

          <div class="dialog-body">
            <!-- Поле для названия группы -->
            <div class="form-group">
              <label for="groupName">
                Название группы *
                <span class="char-counter">{{ formData.name.length }}/100</span>
              </label>
              <input
                  id="groupName"
                  v-model="formData.name"
                  type="text"
                  required
                  placeholder="Введите название группы"
                  :class="{ 'error': validationErrors.name }"
                  @input="validateName"
                  @blur="validateName"
                  :disabled="loading"
              />
              <div v-if="validationErrors.name" class="error-message">
                {{ validationErrors.name }}
              </div>
            </div>

            <!-- Поле для эндпоинта группы (только для чтения) -->
            <div class="form-group">
              <label for="groupEndpoint">
                Эндпоинт группы *
                <span class="endpoint-hint">(изменение недоступно)</span>
              </label>
              <div class="endpoint-readonly">
                <span class="endpoint-prefix">{{ localStorage.getItem('user') || null }}/</span>
                <input
                    id="groupEndpoint"
                    v-model="formData.endpoint"
                    type="text"
                    readonly
                    disabled
                    class="readonly-input"
                />
              </div>
              <div class="hint">
                Полный путь: {{ getFullPath() }}
              </div>
            </div>

            <!-- Поле для описания группы -->
            <div class="form-group">
              <label for="groupDescription">
                Описание
                <span class="char-counter">{{ formData.description.length }}/500</span>
              </label>
              <textarea
                  id="groupDescription"
                  v-model="formData.description"
                  rows="4"
                  placeholder="Введите описание группы (необязательно)"
                  :class="{ 'error': validationErrors.description }"
                  @input="validateDescription"
                  @blur="validateDescription"
                  :disabled="loading"
              ></textarea>
              <div v-if="validationErrors.description" class="error-message">
                {{ validationErrors.description }}
              </div>
            </div>

            <!-- Поле для статуса активности -->
            <div class="form-group">
              <label class="checkbox-label">
                <input
                    type="checkbox"
                    v-model="formData.isActive"
                    :disabled="loading"
                />
                <span>Группа активна</span>
              </label>
              <div class="hint">
                Неактивные группы не будут видны в API
              </div>
            </div>

            <!-- Информация о датах создания/обновления -->
            <div v-if="originalGroup" class="info-section">
              <div class="info-row">
                <span class="info-label">Создана:</span>
                <span class="info-value">{{ formatDate(originalGroup.createdAt) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Последнее обновление:</span>
                <span class="info-value">{{ formatDate(originalGroup.updatedAt) }}</span>
              </div>
            </div>

            <!-- Ошибки валидации -->
            <div v-if="Object.keys(validationErrors).length > 0" class="validation-summary">
              <div class="summary-header">
                <span>⚠️ Пожалуйста, исправьте следующие ошибки:</span>
              </div>
              <ul class="summary-list">
                <li v-for="(error, field) in validationErrors" :key="field" v-if="error">
                  {{ error }}
                </li>
              </ul>
            </div>
          </div>

          <div class="dialog-footer">
            <button
                @click="handleClose"
                class="btn cancel-btn"
                :disabled="loading"
            >
              Отмена
            </button>
            <button
                @click="handleSubmit"
                class="btn submit-btn"
                :disabled="!isFormValid || loading"
            >
              <span v-if="loading" class="spinner-small"></span>
              {{ loading ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';

// Внутри setup
const authStore = useAuthStore();

// Получение полного пути
const getFullPath = () => {
  const username = localStorage.getItem('user') || null;
  const endpoint = formData.value.endpoint;
  return username ? `/${username}/${endpoint}` : `/${endpoint}`;
};


const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  group: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'updated']);

// Исходные данные группы
const originalGroup = computed(() => props.group);

// Состояние формы
const formData = ref({
  name: '',
  endpoint: '',
  description: '',
  isActive: true
});

// Состояние загрузки
const loading = ref(false);

// Ошибки валидации
const validationErrors = ref({});

// Инициализация формы данными группы
const initForm = () => {
  if (originalGroup.value) {
    formData.value = {
      name: originalGroup.value.name || '',
      endpoint: originalGroup.value.endpoint || '',
      description: originalGroup.value.description || '',
      isActive: originalGroup.value.isActive !== undefined ? originalGroup.value.isActive : true
    };
  }
  validateAll();
};

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return 'Неизвестно';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Валидация названия
const validateName = () => {
  const value = formData.value.name.trim();

  if (!value) {
    validationErrors.value.name = 'Название группы обязательно';
  } else if (value.length < 3) {
    validationErrors.value.name = 'Название должно содержать минимум 3 символа';
  } else if (value.length > 100) {
    validationErrors.value.name = 'Название не может превышать 100 символов';
  } else {
    delete validationErrors.value.name;
  }
};

// Валидация описания
const validateDescription = () => {
  const value = formData.value.description.trim();

  if (value.length > 500) {
    validationErrors.value.description = 'Описание не может превышать 500 символов';
  } else {
    delete validationErrors.value.description;
  }
};

// Валидация всех полей
const validateAll = () => {
  validateName();
  validateDescription();
};

// Проверка валидности формы
const isFormValid = computed(() => {
  return formData.value.name.trim() &&
      !validationErrors.value.name &&
      !validationErrors.value.description;
});

// Проверка, были ли изменения
const hasChanges = computed(() => {
  if (!originalGroup.value) return false;

  return formData.value.name !== originalGroup.value.name ||
      formData.value.description !== originalGroup.value.description ||
      formData.value.isActive !== originalGroup.value.isActive;
});

// Сброс формы при открытии/закрытии
watch(() => props.show, (newVal) => {
  if (newVal) {
    initForm();
  } else {
    // Очищаем ошибки при закрытии
    validationErrors.value = {};
  }
});

// Следим за изменениями группы
watch(() => props.group, () => {
  if (props.show) {
    initForm();
  }
}, { deep: true });

// Обработчики
const handleClose = () => {
  if (!loading.value) {
    emit('close');
  }
};

const handleSubmit = async () => {
  validateAll();

  if (!isFormValid.value) {
    return;
  }

  if (!hasChanges.value) {
    // Если нет изменений, просто закрываем
    handleClose();
    return;
  }

  loading.value = true;

  try {
    // Создаем обновленный объект группы
    const updatedGroup = {
      ...originalGroup.value,
      name: formData.value.name.trim(),
      description: formData.value.description.trim(),
      isActive: formData.value.isActive,
      updatedAt: new Date().toISOString()
    };

    // Имитация задержки API (заменить на реальный запрос)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Отправляем обновленные данные
    emit('updated', updatedGroup);
    handleClose();

  } catch (error) {
    console.error('Ошибка при обновлении группы:', error);
    alert('Не удалось обновить группу. Пожалуйста, попробуйте снова.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.dialog-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
  display: flex;
  flex-direction: column;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s;
  line-height: 1;
}

.close-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.2);
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-counter {
  font-size: 0.8rem;
  color: #666;
  font-weight: normal;
  background: #f0f0f0;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
}

.endpoint-hint {
  font-size: 0.8rem;
  color: #f57c00;
  font-weight: normal;
  background: #fff3e0;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
}

.endpoint-readonly {
  display: flex;
  align-items: center;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
}

.endpoint-prefix {
  background: #e0e0e0;
  padding: 0.75rem;
  color: #666;
  font-family: monospace;
  border-right: 2px solid #d0d0d0;
  white-space: nowrap;
  font-size: 0.9rem;
}

.readonly-input {
  flex: 1;
  padding: 0.75rem;
  border: none;
  font-size: 1rem;
  font-family: monospace;
  background: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.readonly-input:focus {
  outline: none;
}

input[type="text"],
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s;
  font-family: inherit;
}

input[type="text"]:focus,
textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

input[type="text"].error,
textarea.error {
  border-color: #f44336;
}

input[type="text"]:disabled,
textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.checkbox-label:hover {
  background: #e9ecef;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label span {
  font-weight: 500;
  color: #333;
}

.hint {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
  padding-left: 0.5rem;
}

.error-message {
  color: #f44336;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  padding-left: 0.5rem;
}

.info-section {
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.info-row:not(:last-child) {
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed #90caf9;
}

.info-label {
  color: #1976d2;
  font-size: 0.9rem;
  font-weight: 500;
}

.info-value {
  color: #0d47a1;
  font-size: 0.9rem;
  font-family: monospace;
}

.validation-summary {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.summary-header {
  font-weight: 600;
  color: #c62828;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.summary-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #d32f2f;
}

.summary-list li {
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.dialog-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: #f8f9fa;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: #e0e0e0;
  color: #666;
}

.cancel-btn:hover:not(:disabled) {
  background: #d5d5d5;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Анимации */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-active .dialog-content,
.dialog-leave-active .dialog-content {
  transition: transform 0.3s ease;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: translateY(-30px) scale(0.95);
}

@media (max-width: 768px) {
  .dialog-content {
    width: 95%;
    height: 95vh;
    max-height: 95vh;
  }

  .dialog-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }

  .endpoint-readonly {
    flex-direction: column;
  }

  .endpoint-prefix {
    width: 100%;
    text-align: center;
    border-right: none;
    border-bottom: 2px solid #d0d0d0;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>