<script>
import axios from 'axios'

export default {
  data() {
    return {
      jsonData: '',
      login: '',       // Переменная для хранения логина
      endpoint: '',
    }
  },
  methods: {

    formatJson() {
      try {
        // Парсим введенный JSON
        const parsed = JSON.parse(this.jsonData);

        // Преобразуем обратно в строку с красивыми отступами
        this.jsonData = JSON.stringify(parsed, null, 2); // indent = 2 пробела

        axios.post(`http://localhost:8000/set_endpoint?login=${this.login}&endpoint=${this.endpoint}`, JSON.parse(this.jsonData),
            {
              headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
              }
            }
        )
      } catch (err) {
        alert('Ошибка формата JSON');

      }
      alert('Endpoint успешно создан');
    }
  }
}
</script>

<template>
  <div class="wrapper">
    <h1>Mock сервис</h1>

    <div id="login_data">
      <!-- Форма для ввода данных -->
      <form @submit.prevent="handleSubmit">
        <label for="login">Login:</label><br/>
        <input type="text" v-model="login" placeholder="Enter your login"><br/><br/>

        <label for="endpoint">Endpoint:</label><br/>
        <input type="url" v-model="endpoint" placeholder="Enter the API endpoint"><br/><br/>

      </form>

    </div>

    <div id="app">
      <textarea v-model="jsonData"></textarea>
    </div>
    <button @click="formatJson()">Валидировать json</button>

  </div>
</template>

<style scoped>


.wrapper {
  width: 900px;
  height: 500px;
  padding: 20px;
  border-radius: 50px;
  background: #1f0f24;
  text-align: center;
  color: #fff
}

.wrapper textarea {
  width: 500px;
  height: 300px;
}


.wrapper h1 {
  margin-top: 50px;
}

.wrapper p {
  margin-top: 20px;
}


.wrapper button {
  background: #e3bc4b;
  color: #fff;
  border-radius: 10px;
  border: 2px solid #b99935;
  padding: 10px 15px;
  margin-left: 20px;
  cursor: pointer;
  transition: transform 500ms ease;
}

.wrapper button:hover {
  transform: scale(1.1) translateY(-5px);
}

</style>
