<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="show" class="dialog-overlay" @click.self="handleClose">
        <div class="dialog-content">
          <div class="dialog-header">
            <h2>{{ isEditMode ? 'Редактирование эндпоинта' : 'Создание нового эндпоинта' }}</h2>
            <button @click="handleClose" class="close-btn" :disabled="loading">✕</button>
          </div>

          <div class="dialog-body">
            <!-- Поле для HTTP метода -->
            <div class="form-group">
              <label for="httpMethod">
                HTTP метод *
                <span class="method-info">Выберите метод запроса</span>
              </label>
              <div class="method-select-wrapper">
                <select
                    id="httpMethod"
                    v-model="formData.method"
                    class="method-select"
                    :class="{ 'error': errors.method }"
                    @change="validateMethod"
                    :disabled="loading"
                >
                  <option value="" disabled>Выберите метод</option>
                  <option
                      v-for="method in httpMethods"
                      :key="method.value"
                      :value="method.value"
                      :class="method.class"
                  >
                    {{ method.label }}
                  </option>
                </select>
                <div class="method-badge" :class="formData.method.toLowerCase()" v-if="formData.method">
                  {{ formData.method }}
                </div>
              </div>
              <div v-if="errors.method" class="error-message">
                {{ errors.method }}
              </div>
              <div class="method-description" v-if="selectedMethodDescription">
                {{ selectedMethodDescription }}
              </div>
            </div>

            <!-- Поле для пути эндпоинта -->
            <div class="form-group">
              <label for="endpointPath">
                Путь эндпоинта *
                <span class="path-preview">/api/v1/{{ groupEndpoint }}/{{ formData.path }}</span>
              </label>
              <div class="path-input-wrapper">
                <span class="path-prefix">/api/v1/{{ groupEndpoint }}/</span>
                <input
                    id="endpointPath"
                    v-model="formData.path"
                    type="text"
                    required
                    placeholder="users/get-all"
                    :class="{ 'error': errors.path }"
                    @input="validatePath"
                    @blur="validatePath"
                    :disabled="loading"
                />
              </div>
              <div v-if="errors.path" class="error-message">
                {{ errors.path }}
              </div>
              <div v-else class="hint">
                Только латинские буквы, цифры, дефисы и слеши
              </div>
            </div>

            <!-- Поле для JSON данных -->
            <div class="form-group">
              <label for="jsonData">
                JSON данные *
                <span class="json-status" :class="{ 'valid': isJsonValid, 'invalid': errors.json }">
                  {{ errors.json ? '❌ Невалидный JSON' : '✅ JSON валидный' }}
                </span>
              </label>
              <div class="json-editor">
                <textarea
                    id="jsonData"
                    v-model="formData.jsonString"
                    rows="10"
                    required
                    placeholder='{\n  "key": "value"\n}'
                    :class="{ 'error': errors.json }"
                    @input="validateJson"
                    @blur="validateJson"
                    :disabled="loading"
                    spellcheck="false"
                ></textarea>
                <div class="json-line-numbers">
                  <div v-for="n in jsonLines" :key="n" class="line-number">{{ n }}</div>
                </div>
              </div>
              <div v-if="errors.json" class="error-message">
                {{ errors.json }}
              </div>
              <div v-else-if="formData.jsonString && isJsonValid" class="json-preview">
                <div class="preview-header">Предпросмотр:</div>
                <pre class="preview-content">{{ formatJsonPreview }}</pre>
              </div>
            </div>

            <!-- Поле для описания (опционально) -->
            <div class="form-group">
              <label for="endpointDescription">
                Описание
                <span class="char-counter">{{ formData.description.length }}/200</span>
              </label>
              <textarea
                  id="endpointDescription"
                  v-model="formData.description"
                  rows="2"
                  placeholder="Введите описание эндпоинта (необязательно)"
                  :disabled="loading"
              ></textarea>
            </div>

            <!-- Сводка ошибок -->
            <div v-if="hasErrors" class="validation-errors">
              <div class="errors-header">
                <span>⚠️ Невозможно {{ isEditMode ? 'сохранить' : 'создать' }} эндпоинт:</span>
              </div>
              <ul class="errors-list">
                <li v-for="(error, key) in errors" :key="key" v-if="error">
                  {{ error }}
                </li>
              </ul>
            </div>

            <!-- Информация о режиме редактирования -->
            <div v-if="isEditMode && originalEndpoint" class="edit-info">
              <div class="info-icon">ℹ️</div>
              <div class="info-text">
                Редактирование эндпоинта <strong>{{ originalEndpoint.name }}</strong>
              </div>
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
                :class="{ 'edit-mode': isEditMode, [formData.method.toLowerCase()]: formData.method }"
                :disabled="!isFormValid || loading"
            >
              <span v-if="loading" class="spinner-small"></span>
              {{ loading
                ? (isEditMode ? 'Сохранение...' : 'Создание...')
                : (isEditMode ? 'Сохранить изменения' : 'Создать эндпоинт')
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import endpointService from '@/stores/endpointService';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  groupEndpoint: {
    type: String,
    required: true
  },
  login: {
    type: String,
    required: true
  },
  // Данные для редактирования
  endpointToEdit: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'created', 'updated']);

// Список HTTP методов
const httpMethods = [
  { value: 'GET', label: 'GET - Получить данные', class: 'get', description: 'Используется для получения данных' },
  { value: 'POST', label: 'POST - Создать данные', class: 'post', description: 'Используется для создания новых ресурсов' },
  { value: 'PUT', label: 'PUT - Обновить данные', class: 'put', description: 'Используется для полного обновления ресурса' },
  { value: 'PATCH', label: 'PATCH - Частично обновить', class: 'patch', description: 'Используется для частичного обновления ресурса' },
  { value: 'DELETE', label: 'DELETE - Удалить данные', class: 'delete', description: 'Используется для удаления ресурса' },
  { value: 'HEAD', label: 'HEAD - Заголовки', class: 'head', description: 'Аналогичен GET, но без тела ответа' },
  { value: 'OPTIONS', label: 'OPTIONS - Информация', class: 'options', description: 'Используется для получения информации о доступных опциях' }
];

// Режим (создание или редактирование)
const isEditMode = computed(() => props.endpointToEdit !== null);
const originalEndpoint = computed(() => props.endpointToEdit);

// Состояние формы
const formData = ref({
  method: '',
  path: '',
  jsonString: '',
  description: ''
});

// Состояние загрузки
const loading = ref(false);

// Ошибки валидации
const errors = ref({
  method: '',
  path: '',
  json: ''
});

// Регулярное выражение для пути
const pathRegex = /^[a-zA-Z0-9\-/]+$/;

// Инициализация формы
const initForm = () => {
  if (isEditMode.value && originalEndpoint.value) {
    // Режим редактирования
    formData.value = {
      method: originalEndpoint.value.method || 'GET',
      path: originalEndpoint.value.path || '',
      jsonString: originalEndpoint.value.jsonData
          ? (typeof originalEndpoint.value.jsonData === 'string'
              ? originalEndpoint.value.jsonData
              : JSON.stringify(originalEndpoint.value.jsonData, null, 2))
          : '',
      description: originalEndpoint.value.description || ''
    };
  } else {
    // Режим создания
    formData.value = {
      method: '',
      path: '',
      jsonString: '',
      description: ''
    };
  }

  // Сбрасываем ошибки
  errors.value = {
    method: '',
    path: '',
    json: ''
  };
};

// Описание выбранного метода
const selectedMethodDescription = computed(() => {
  const method = httpMethods.find(m => m.value === formData.value.method);
  return method ? method.description : '';
});

// Валидация метода
const validateMethod = () => {
  if (!formData.value.method) {
    errors.value.method = 'Выберите HTTP метод';
  } else {
    errors.value.method = '';
  }
};

// Валидация пути
const validatePath = () => {
  const value = formData.value.path.trim();

  if (!value) {
    errors.value.path = 'Путь эндпоинта обязателен';
  } else if (!pathRegex.test(value)) {
    errors.value.path = 'Только латинские буквы, цифры, дефисы и слеши';
  } else if (value.startsWith('/') || value.endsWith('/')) {
    errors.value.path = 'Путь не должен начинаться или заканчиваться слешем';
  } else if (value.includes('//')) {
    errors.value.path = 'Путь не должен содержать двойных слешей';
  } else if (value.length < 3) {
    errors.value.path = 'Минимум 3 символа';
  } else if (value.length > 100) {
    errors.value.path = 'Максимум 100 символов';
  } else {
    errors.value.path = '';
  }
};

// Проверка валидности JSON
const isJsonValid = computed(() => {
  if (!formData.value.jsonString.trim()) return false;
  try {
    JSON.parse(formData.value.jsonString);
    return true;
  } catch {
    return false;
  }
});

// Валидация JSON
const validateJson = () => {
  const value = formData.value.jsonString.trim();

  if (!value) {
    errors.value.json = 'JSON данные обязательны';
  } else {
    try {
      JSON.parse(value);
      errors.value.json = '';
    } catch (e) {
      errors.value.json = `Ошибка JSON: ${e.message}`;
    }
  }
};

// Количество строк в JSON
const jsonLines = computed(() => {
  return formData.value.jsonString.split('\n').length;
});

// Форматированный предпросмотр JSON
const formatJsonPreview = computed(() => {
  if (!formData.value.jsonString || !isJsonValid.value) return '';
  try {
    const parsed = JSON.parse(formData.value.jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return '';
  }
});

// Проверка наличия ошибок
const hasErrors = computed(() => {
  return Object.values(errors.value).some(error => error);
});

// Проверка валидности формы
const isFormValid = computed(() => {
  return formData.value.method &&
      formData.value.path.trim() &&
      !errors.value.path &&
      formData.value.jsonString.trim() &&
      isJsonValid.value;
});

// Сброс формы при открытии
watch(() => props.show, (newVal) => {
  if (newVal) {
    initForm();
  }
});

// Следим за изменениями endpointToEdit
watch(() => props.endpointToEdit, (newVal) => {
  if (newVal && props.show) {
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
  // Финальная валидация
  validateMethod();
  validatePath();
  validateJson();

  if (!isFormValid.value) return;

  loading.value = true;

  try {
    const endpointPath = formData.value.path;
    const jsonPayload = JSON.parse(formData.value.jsonString);

    if (isEditMode.value) {
      // РЕЖИМ РЕДАКТИРОВАНИЯ
      const result = await endpointService.updateEndpoint(originalEndpoint.value.id, {
        path: endpointPath,
        method: formData.value.method,
        jsonData: jsonPayload
      });

      console.log('Результат обновления:', result);

      if (result.success) {
        // Просто сообщаем об успешном обновлении
        emit('updated');
        handleClose();
      } else {
        throw new Error(result.message || 'Не удалось обновить эндпоинт');
      }
    } else {
      // РЕЖИМ СОЗДАНИЯ
      const result = await endpointService.createEndpoint({
        path: endpointPath,
        method: formData.value.method,
        jsonData: jsonPayload,
        groupName: props.groupEndpoint
      });

      console.log('Результат создания:', result);

      if (result.success) {
        // Просто сообщаем об успешном создании
        emit('created');
        handleClose();
      } else {
        throw new Error(result.message || 'Не удалось создать эндпоинт');
      }
    }

  } catch (error) {
    console.error(`Ошибка при ${isEditMode.value ? 'обновлении' : 'создании'} эндпоинта:`, error);

    const errorMessage = error.message || (
        isEditMode.value
            ? 'Не удалось обновить эндпоинт'
            : 'Не удалось создать эндпоинт'
    );

    alert(errorMessage);
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
  max-width: 700px;
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

.method-info {
  font-size: 0.85rem;
  color: #666;
  font-weight: normal;
}

.method-select-wrapper {
  position: relative;
}

.method-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.2rem;
  font-weight: 500;
}

.method-select:focus {
  outline: none;
  border-color: #667eea;
}

.method-select.error {
  border-color: #f44336;
}

.method-badge {
  position: absolute;
  right: 3rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
  pointer-events: none;
}

.method-badge.get { background-color: #61affe; }
.method-badge.post { background-color: #49cc90; }
.method-badge.put { background-color: #fca130; }
.method-badge.patch { background-color: #50e3c2; }
.method-badge.delete { background-color: #f93e3e; }
.method-badge.head { background-color: #9013fe; }
.method-badge.options { background-color: #8b572a; }

.method-description {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #666;
  border-left: 3px solid #667eea;
}

.path-preview {
  font-size: 0.85rem;
  color: #667eea;
  background: #eef2ff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.path-input-wrapper {
  display: flex;
  align-items: center;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.path-input-wrapper:focus-within {
  border-color: #667eea;
}

.path-prefix {
  background: #f5f5f5;
  padding: 0.75rem;
  color: #666;
  font-family: monospace;
  border-right: 2px solid #e0e0e0;
  white-space: nowrap;
  font-size: 0.9rem;
}

.path-input-wrapper input {
  flex: 1;
  padding: 0.75rem;
  border: none;
  font-size: 1rem;
  font-family: monospace;
}

.path-input-wrapper input:focus {
  outline: none;
}

.path-input-wrapper input.error {
  background-color: #ffebee;
}

.hint {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.json-editor {
  position: relative;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.json-editor:focus-within {
  border-color: #667eea;
}

.json-editor textarea {
  width: 100%;
  padding: 0.75rem;
  padding-left: 3rem;
  border: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  background: #fafafa;
}

.json-editor textarea:focus {
  outline: none;
  background: white;
}

.json-editor textarea.error {
  background-color: #ffebee;
}

.json-line-numbers {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2.5rem;
  background: #f0f0f0;
  border-right: 1px solid #ddd;
  padding: 0.75rem 0;
  text-align: center;
  font-family: monospace;
  font-size: 0.85rem;
  color: #999;
  user-select: none;
  pointer-events: none;
  overflow: hidden;
}

.line-number {
  line-height: 1.5;
}

.json-status {
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.json-status.valid {
  background: #e8f5e9;
  color: #2e7d32;
}

.json-status.invalid {
  background: #ffebee;
  color: #c62828;
}

.json-preview {
  margin-top: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.preview-header {
  background: #f5f5f5;
  padding: 0.5rem;
  font-size: 0.85rem;
  color: #666;
  border-bottom: 1px solid #e0e0e0;
}

.preview-content {
  padding: 0.75rem;
  background: #fafafa;
  font-family: monospace;
  font-size: 0.85rem;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.error-message {
  color: #f44336;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.validation-errors {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.errors-header {
  font-weight: 600;
  color: #c62828;
  margin-bottom: 0.5rem;
}

.errors-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #d32f2f;
}

.errors-list li {
  margin-bottom: 0.25rem;
}

.edit-info {
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-icon {
  font-size: 1.25rem;
}

.info-text {
  color: #1565c0;
  font-size: 0.95rem;
}

.info-text strong {
  color: #0d47a1;
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
  min-width: 140px;
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

.submit-btn.edit-mode {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.submit-btn.get { background: linear-gradient(135deg, #61affe 0%, #4a90e2 100%); }
.submit-btn.post { background: linear-gradient(135deg, #49cc90 0%, #35a16b 100%); }
.submit-btn.put { background: linear-gradient(135deg, #fca130 0%, #f57c00 100%); }
.submit-btn.patch { background: linear-gradient(135deg, #50e3c2 0%, #3aa68c 100%); }
.submit-btn.delete { background: linear-gradient(135deg, #f93e3e 0%, #d32f2f 100%); }
.submit-btn.head { background: linear-gradient(135deg, #9013fe 0%, #6b0fb3 100%); }
.submit-btn.options { background: linear-gradient(135deg, #8b572a 0%, #5f3a1c 100%); }

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
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

  .path-input-wrapper {
    flex-direction: column;
  }

  .path-prefix {
    width: 100%;
    text-align: center;
    border-right: none;
    border-bottom: 2px solid #e0e0e0;
  }

  .json-editor textarea {
    padding-left: 2.5rem;
  }

  .dialog-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }

  .method-badge {
    right: 2.5rem;
  }
}
</style>