<template>
  <div class="group-card" :class="{ 'inactive': !group.isActive }">
    <div class="card-header">
      <div class="title-section">
        <h3 class="group-name">{{ group.name }}</h3>
        <span class="status-badge" :class="{ 'active': group.isActive, 'inactive': !group.isActive }">
          {{ group.isActive ? 'Активна' : 'Неактивна' }}
        </span>
      </div>
      <div class="card-actions">
        <button @click="handleToggleStatus" class="icon-btn toggle-btn" :title="group.isActive ? 'Деактивировать' : 'Активировать'">
          <span v-if="group.isActive" class="icon">🔴</span>
          <span v-else class="icon">🟢</span>
        </button>
        <button @click="handleEdit" class="icon-btn edit-btn" title="Редактировать">
          <span class="icon">✏️</span>
        </button>
        <button @click="confirmDelete" class="icon-btn delete-btn" title="Удалить">
          <span class="icon">🗑️</span>
        </button>
      </div>
    </div>

    <div class="endpoint-badge">
      <span class="endpoint-label">Эндпоинт:</span>
      <span class="endpoint-value">{{ group.endpoint }}</span>
    </div>

    <p class="group-description" v-if="group.description">{{ group.description }}</p>

    <div class="group-stats">
      <div class="stat">
        <span class="stat-label">Эндпоинты:</span>
        <span class="stat-value">{{ group.endpoints.length }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Создана:</span>
        <span class="stat-value">{{ formatDate(group.createdAt) }}</span>
      </div>
      <div class="stat" v-if="group.endpoints.length > 0">
        <span class="stat-label">Методы:</span>
        <span class="method-badges">
          <span
              v-for="method in getUniqueMethods(group.endpoints)"
              :key="method"
              class="method-badge"
              :class="method.toLowerCase()"
          >
            {{ method }}
          </span>
        </span>
      </div>
    </div>

    <div class="card-footer">
      <button @click="handleViewDetails" class="details-btn">
        Подробнее
        <span class="arrow">→</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useDialogStore } from '@/stores/dialog';

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['toggle-status', 'edit', 'delete', 'view-details']);
const dialogStore = useDialogStore();

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const getUniqueMethods = (endpoints) => {
  const methods = [...new Set(endpoints.map(e => e.method))];
  return methods.sort();
};

const handleToggleStatus = () => {
  emit('toggle-status', props.group.id);
};

const handleEdit = () => {
  emit('edit', props.group);
};

const confirmDelete = () => {
  dialogStore.showDialog({
    title: 'Удаление группы',
    message: 'Вы уверены, что хотите удалить эту группу?',
    itemName: props.group.name,
    type: 'danger',
    confirmText: 'Удалить',
    cancelText: 'Отмена',
    onConfirm: async () => {
      dialogStore.setLoading(true);
      try {
        await emit('delete', props.group.id);
        dialogStore.hideDialog();
      } catch (error) {
        console.error('Ошибка при удалении:', error);
        dialogStore.setLoading(false);
      }
    }
  });
};

const handleViewDetails = () => {
  emit('view-details', props.group.id);
};
</script>

<style scoped>
/* ... стили остаются без изменений ... */
</style>

<style scoped>
.group-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.group-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.group-card.inactive {
  opacity: 0.7;
  background: #f8f9fa;
  border-color: #dee2e6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.title-section {
  flex: 1;
}

.group-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.active {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.status-badge.inactive {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.endpoint-badge {
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 20px;
  padding: 0.35rem 1rem;
  margin-bottom: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.endpoint-label {
  color: #1976d2;
  font-weight: 500;
}

.endpoint-value {
  color: #0d47a1;
  font-family: monospace;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: #f0f0f0;
}

.icon-btn.toggle-btn:hover .icon {
  transform: scale(1.1);
}

.icon-btn.edit-btn:hover {
  color: #1976d2;
}

.icon-btn.delete-btn:hover {
  color: #d32f2f;
  background-color: #ffebee;
}

.icon {
  font-size: 1.1rem;
}

.group-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.group-stats {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  flex: 1;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.stat:last-child {
  margin-bottom: 0;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.method-badges {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.method-badge {
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
}

.method-badge.get {
  background-color: #61affe;
}

.method-badge.post {
  background-color: #49cc90;
}

.method-badge.put {
  background-color: #fca130;
}

.method-badge.delete {
  background-color: #f93e3e;
}

.method-badge.patch {
  background-color: #50e3c2;
}

.card-footer {
  margin-top: auto;
}

.details-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.details-btn:hover {
  opacity: 0.9;
}

.arrow {
  transition: transform 0.3s;
}

.details-btn:hover .arrow {
  transform: translateX(4px);
}
</style>