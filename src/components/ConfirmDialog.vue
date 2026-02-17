<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="show" class="dialog-overlay" @click.self="handleCancel">
        <div class="dialog-content" :class="dialogConfig.type">
          <div class="dialog-header">
            <div class="header-icon" :class="dialogConfig.type">
              <span v-if="dialogConfig.type === 'danger'">⚠️</span>
              <span v-else-if="dialogConfig.type === 'warning'">⚠️</span>
              <span v-else-if="dialogConfig.type === 'info'">ℹ️</span>
              <span v-else>❓</span>
            </div>
            <h3 class="dialog-title">{{ dialogConfig.title }}</h3>
          </div>

          <div class="dialog-body">
            <p class="dialog-message">{{ dialogConfig.message }}</p>
            <div v-if="dialogConfig.itemName" class="dialog-item">
              <span class="item-label">Элемент:</span>
              <span class="item-value">{{ dialogConfig.itemName }}</span>
            </div>
          </div>

          <div class="dialog-footer">
            <button
                @click="handleCancel"
                class="btn cancel-btn"
                :disabled="dialogConfig.loading"
            >
              {{ dialogConfig.cancelText }}
            </button>
            <button
                @click="handleConfirm"
                class="btn confirm-btn"
                :class="dialogConfig.type"
                :disabled="dialogConfig.loading"
            >
              <span v-if="dialogConfig.loading" class="spinner-small"></span>
              {{ dialogConfig.loading ? 'Удаление...' : dialogConfig.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useDialogStore } from '@/stores/dialog';

const dialogStore = useDialogStore();
const { showConfirmDialog, dialogConfig } = storeToRefs(dialogStore);

const show = computed(() => showConfirmDialog.value);

const handleConfirm = async () => {
  if (dialogConfig.value.onConfirm) {
    await dialogConfig.value.onConfirm();
  }
};

const handleCancel = () => {
  if (dialogConfig.value.onCancel) {
    dialogConfig.value.onCancel();
  }
  dialogStore.hideDialog();
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
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.dialog-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideIn 0.3s ease;
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
  padding: 1.5rem 1.5rem 0.5rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.header-icon.danger {
  background: #ffebee;
  color: #c62828;
}

.header-icon.warning {
  background: #fff3e0;
  color: #ef6c00;
}

.header-icon.info {
  background: #e3f2fd;
  color: #1565c0;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
  font-weight: 600;
}

.dialog-body {
  padding: 0.5rem 1.5rem 1.5rem 1.5rem;
}

.dialog-message {
  color: #666;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.dialog-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-left: 4px solid;
}

.dialog-content.danger .dialog-item {
  border-left-color: #f44336;
}

.dialog-content.warning .dialog-item {
  border-left-color: #ff9800;
}

.dialog-content.info .dialog-item {
  border-left-color: #2196f3;
}

.item-label {
  color: #666;
  font-size: 0.9rem;
}

.item-value {
  color: #333;
  font-weight: 600;
  word-break: break-word;
}

.dialog-footer {
  padding: 1rem 1.5rem 1.5rem 1.5rem;
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
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
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

.confirm-btn {
  color: white;
}

.confirm-btn.danger {
  background: #f44336;
}

.confirm-btn.danger:hover:not(:disabled) {
  background: #d32f2f;
}

.confirm-btn.warning {
  background: #ff9800;
}

.confirm-btn.warning:hover:not(:disabled) {
  background: #f57c00;
}

.confirm-btn.info {
  background: #2196f3;
}

.confirm-btn.info:hover:not(:disabled) {
  background: #1976d2;
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

@media (max-width: 480px) {
  .dialog-content {
    width: 95%;
    margin: 1rem;
  }

  .dialog-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>