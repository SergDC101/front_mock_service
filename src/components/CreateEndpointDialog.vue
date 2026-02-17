<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="show" class="dialog-overlay" @click.self="handleClose">
        <div class="dialog-content">
          <div class="dialog-header">
            <h2>Создание нового эндпоинта</h2>
            <button @click="handleClose" class="close-btn" :disabled="loading">✕</button>
          </div>

          <div class="dialog-body">
            <!-- Поле для пути эндпоинта -->
            <div class="form-group">
              <label for="endpointPath">
                Путь эндпоинта *
                <span class="path-preview">/api/v1/{{ groupEndpoint }}/{{ endpointPath }}</span>
              </label>
              <div class="path-input-wrapper">
                <span class="path-prefix">/api/v1/{{ groupEndpoint }}/</span>
                <input
                    id="endpointPath"
                    v-model="endpointPath"
                    type="text"
                    required
                    placeholder="users/get-all"
                    :class="{ 'error': pathError }"
                    @input="validatePath"
                    @blur="validatePath"
                    :disabled="loading"
                />
              </div>
              <div v-if="pathError" class="error-message">
                {{ pathError }}
              </div>
              <div v-else class="hint">
                Только латинские буквы, цифры, дефисы и слеши
              </div>
            </div>

            <!-- Поле для JSON данных -->
            <div class="form-group">
              <label for="jsonData">
                JSON данные *
                <span class="json-status" :class="{ 'valid': isJsonValid, 'invalid': jsonError }">
                  {{ jsonError ? '❌ Невалидный JSON' : '✅ JSON валидный' }}
                </span>
              </label>
              <div class="json-editor">
                <textarea
                    id="jsonData"
                    v-model="jsonData"
                    rows="10"
                    required
                    placeholder='{\n  "key": "value"\n}'
                    :class="{ 'error': jsonError }"
                    @input="validateJson"
                    @blur="validateJson"
                    :disabled="loading"
                    spellcheck="false"
                ></textarea>
                <div class="json-line-numbers">
                  <div v-for="n in jsonLines" :key="n" class="line-number">{{ n }}</div>
                </div>
              </div>
              <div v-if="jsonError" class="error-message">
                {{ jsonError }}
              </div>
              <div v-else-if="jsonData && isJsonValid" class="json-preview">
                <div class="preview-header">Предпросмотр:</div>
                <pre class="preview-content">{{ formatJsonPreview }}</pre>
              </div>
            </div>

            <!-- Дополнительная информация -->
            <div v-if="validationErrors.length > 0" class="validation-errors">
              <div class="errors-header">
                <span>⚠️ Невозможно создать эндпоинт:</span>
              </div>
              <ul class="errors-list">
                <li v-for="(error, index) in validationErrors" :key="index">
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
              {{ loading ? 'Создание...' : 'Создать эндпоинт' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import api from '@/services/api';

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
  }
});

const emit = defineEmits(['close', 'created']);

// Состояние формы
const endpointPath = ref('');
const jsonData = ref('');
const loading = ref(false);

// Валидация
const pathError = ref('');
const jsonError = ref('');

// Регулярное выражение для пути (латиница, цифры, дефисы, слеши)
const pathRegex = /^[a-zA-Z0-9\-/]+$/;

// Валидация пути
const validatePath = () => {
  const value = endpointPath.value.trim();

  if (!value) {
    pathError.value = 'Путь эндпоинта обязателен';
  } else if (!pathRegex.test(value)) {
    pathError.value = 'Только латинские буквы, цифры, дефисы и слеши';
  } else if (value.startsWith('/') || value.endsWith('/')) {
    pathError.value = 'Путь не должен начинаться или заканчиваться слешем';
  } else if (value.includes('//')) {
    pathError.value = 'Путь не должен содержать двойных слешей';
  } else if (value.length < 3) {
    pathError.value = 'Минимум 3 символа';
  } else if (value.length > 100) {
    pathError.value = 'Максимум 100 символов';
  } else {
    pathError.value = '';
  }
};

// Проверка валидности JSON
const isJsonValid = computed(() => {
  if (!jsonData.value.trim()) return false;
  try {
    JSON.parse(jsonData.value);
    return true;
  } catch {
    return false;
  }
});

// Валидация JSON
const validateJson = () => {
  const value = jsonData.value.trim();

  if (!value) {
    jsonError.value = 'JSON данные обязательны';
  } else {
    try {
      JSON.parse(value);
      jsonError.value = '';
    } catch (e) {
      jsonError.value = `Ошибка JSON: ${e.message}`;
    }
  }
};

// Количество строк в JSON для нумерации
const jsonLines = computed(() => {
  return jsonData.value.split('\n').length;
});

// Форматированный предпросмотр JSON
const formatJsonPreview = computed(() => {
  if (!jsonData.value || !isJsonValid.value) return '';
  try {
    const parsed = JSON.parse(jsonData.value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return '';
  }
});

// Валидация всей формы
const validationErrors = computed(() => {
  const errors = [];

  if (pathError.value) {
    errors.push(pathError.value);
  }

  if (jsonError.value) {
    errors.push(jsonError.value);
  }

  if (!endpointPath.value.trim()) {
    errors.push('Укажите путь эндпоинта');
  }

  if (!jsonData.value.trim()) {
    errors.push('Укажите JSON данные');
  }

  return errors;
});

// Проверка валидности формы
const isFormValid = computed(() => {
  return endpointPath.value.trim() &&
      !pathError.value &&
      jsonData.value.trim() &&
      isJsonValid.value;
});

// Сброс формы при открытии
watch(() => props.show, (newVal) => {
  if (newVal) {
    endpointPath.value = '';
    jsonData.value = '';
    pathError.value = '';
    jsonError.value = '';
  }
});

// Обработчики
const handleClose = () => {
  if (!loading.value) {
    emit('close');
  }
};

const handleSubmit = async () => {
  // Финальная валидация
  validatePath();
  validateJson();

  if (!isFormValid.value) return;

  loading.value = true;

  try {
    const fullPath = `${endpointPath.value.trim()}`;
    const jsonPayload = JSON.parse(jsonData.value);

    // Формируем URL с параметрами
    const url = `http://localhost:8000/set_endpoint?login=${encodeURIComponent(props.login)}&endpoint=${encodeURIComponent(fullPath)}`;

    // Отправляем запрос
    const response = await api.post(url, jsonPayload, {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      }
    });

    console.log('Эндпоинт создан:', response.data);

    // Показываем успех и закрываем диалог
    emit('created', response.data);
    handleClose();

  } catch (error) {
    console.error('Ошибка при создании эндпоинта:', error);

    let errorMessage = 'Не удалось создать эндпоинт';
    if (error.response) {
      // Сервер вернул ошибку
      errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
    } else if (error.request) {
      // Запрос был отправлен, но нет ответа
      errorMessage = 'Сервер не отвечает. Проверьте подключение.';
    }

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
}
</style>