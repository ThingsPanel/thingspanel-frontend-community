<template>
  <div>123</div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.i18n-test-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5em;
}

.header p {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1em;
}

.language-switcher {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 15px;
}

.lang-btn {
  padding: 12px 24px;
  border: 2px solid #007bff;
  background: white;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.lang-btn:hover {
  background: #007bff;
  color: white;
  transform: translateY(-2px);
}

.lang-btn.active {
  background: #007bff;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
}

.test-section h3 {
  margin: 0 0 20px 0;
  color: #495057;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.test-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.test-item label {
  font-weight: 600;
  color: #6c757d;
  min-width: 150px;
  margin-right: 15px;
}

.test-item span {
  color: #495057;
  font-weight: 500;
}

.button-showcase {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.demo-btn {
  padding: 10px 20px;
  border: 1px solid #dee2e6;
  background: #f8f9fa;
  color: #495057;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-btn:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.interpolation-tests .test-item {
  flex-direction: column;
  align-items: flex-start;
}

.greeting {
  margin: 8px 0 0 0;
  font-size: 1.1em;
  color: #28a745;
  font-weight: 500;
}

.feature-list {
  list-style: none;
  padding: 0;
}

.feature-list li {
  padding: 8px 0;
  font-size: 1.1em;
  color: #495057;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  font-weight: 500;
}

.status-item .icon {
  margin-right: 10px;
  font-size: 1.2em;
}

.status-item.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-item.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-item.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-item.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.live-test {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.test-input {
  padding: 12px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.test-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.test-result {
  padding: 15px;
  background: #e9ecef;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
}

@media (max-width: 768px) {
  .i18n-test-page {
    padding: 10px;
  }

  .test-grid {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
    align-items: center;
  }

  .lang-btn {
    width: 200px;
  }
}
</style>
