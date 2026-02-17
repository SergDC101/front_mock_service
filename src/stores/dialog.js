import { defineStore } from 'pinia';

export const useDialogStore = defineStore('dialog', {
    state: () => ({
        showConfirmDialog: false,
        dialogConfig: {
            title: 'Подтверждение удаления',
            message: 'Вы уверены, что хотите удалить этот элемент?',
            itemName: '',
            type: 'danger',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            onConfirm: null,
            onCancel: null,
            loading: false
        }
    }),

    actions: {
        showDialog(config) {
            this.dialogConfig = {
                ...this.dialogConfig,
                ...config,
                onConfirm: config.onConfirm || null,
                onCancel: config.onCancel || null
            };
            this.showConfirmDialog = true;
        },

        hideDialog() {
            this.showConfirmDialog = false;
            // Очищаем колбэки после закрытия
            setTimeout(() => {
                this.dialogConfig.onConfirm = null;
                this.dialogConfig.onCancel = null;
                this.dialogConfig.loading = false;
            }, 300);
        },

        setLoading(loading) {
            this.dialogConfig.loading = loading;
        }
    }
});