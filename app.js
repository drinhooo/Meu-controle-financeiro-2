// Meu Controle - aplicação de controle financeiro
// Os dados ficam na memória enquanto a página estiver aberta.
const form = document.querySelector('#transaction-form');
const descriptionInput = document.querySelector('#description');
const amountInput = document.querySelector('#amount');
const categoryInput = document.querySelector('#category');
const dateInput = document.querySelector('#date');
const filterInput = document.querySelector('#filter');
const searchInput = document.querySelector('#search');
const list = document.querySelector('#transaction-list');
const emptyState = document.querySelector('#empty-state');
const toast = document.querySelector('#toast');

let transactions = [];
let nextId = 1;

const currency = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};
dateInput.value = dateToday();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function clearErrors() {
  ['description', 'amount', 'category', 'date'].forEach(id => {
    document.querySelector(`#${id}-error`).textContent = '';
  });
}

function validateForm(description, amount, category, date) {
  let valid = true;
  if (!description.trim()) {
    document.querySelector('#description-error').textContent = 'Informe uma descrição.';
    valid = false;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    document.querySelector('#amount-error').textContent = 'Digite um valor maior que zero.';
    valid = false;
  }
  if (!category) {
    document.querySelector('#category-error').textContent = 'Selecione uma categoria.';
    valid = false;
  }
  if (!date || date > dateToday()) {
    document.querySelector('#date-error').textContent = 'Informe uma data válida, até hoje.';
    valid = false;
  }
  return valid;
}

function updateSummary() {
  const income = transactions
    .filter(item => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0);
  const expenses = transactions
    .filter(item => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0);

  document.querySelector('#income-total').textContent = currency(income);
  document.querySelector('#expense-total').textContent = currency(expenses);
  document.querySelector('#balance').textContent = currency(income - expenses);
  document.querySelector('#transaction-count').textContent =
    `${transactions.length} ${transactions.length === 1 ? 'registro' : 'registros'}`;
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
}

function renderTransactions() {
  const selectedType = filterInput.value;
  const term = searchInput.value.trim().toLocaleLowerCase('pt-BR');
  const filtered = transactions
    .filter(item => selectedType === 'all' || item.type === selectedType)
    .filter(item => `${item.description} ${item.category}`.toLocaleLowerCase('pt-BR').includes(term))
    .sort((a, b) => b.id - a.id);

  list.innerHTML = '';
  emptyState.hidden = filtered.length > 0;

  filtered.forEach(item => {
    const row = document.createElement('tr');

    const descriptionCell = document.createElement('td');
    const name = document.createElement('span');
    name.className = 'transaction-name';
    name.textContent = item.description;
    const category = document.createElement('span');
    category.className = 'category-label';
    category.textContent = item.category;
    descriptionCell.append(name, category);

    const dateCell = document.createElement('td');
    dateCell.className = 'date-cell';
    dateCell.textContent = formatDate(item.date);

    const valueCell = document.createElement('td');
    valueCell.className = `value-cell ${item.type === 'income' ? 'value-income' : 'value-expense'}`;
    valueCell.textContent = `${item.type === 'income' ? '+' : '−'} ${currency(item.amount)}`;

    const actionCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', `Excluir ${item.description}`);
    deleteButton.addEventListener('click', () => deleteTransaction(item.id));
    actionCell.append(deleteButton);

    row.append(descriptionCell, dateCell, valueCell, actionCell);
    list.append(row);
  });

  document.querySelector('#list-foot').textContent = filtered.length
    ? `Exibindo ${filtered.length} de ${transactions.length} movimentações.`
    : 'Nenhum resultado encontrado para esse filtro.';
}

function deleteTransaction(id) {
  const item = transactions.find(transaction => transaction.id === id);
  if (!item) return;
  transactions = transactions.filter(transaction => transaction.id !== id);
  updateSummary();
  renderTransactions();
  showToast('Movimentação excluída.');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  clearErrors();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const type = form.elements.type.value;
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!validateForm(description, amount, category, date)) return;

  transactions.push({ id: nextId++, description, amount, type, category, date });
  form.reset();
  dateInput.value = dateToday();
  document.querySelector('#income-option').classList.add('selected');
  document.querySelector('#expense-option').classList.remove('selected');
  updateSummary();
  renderTransactions();
  showToast('Movimentação adicionada com sucesso!');
});

form.querySelectorAll('input[name="type"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelector('#income-option').classList.toggle('selected', radio.value === 'income' && radio.checked);
    document.querySelector('#expense-option').classList.toggle('selected', radio.value === 'expense' && radio.checked);
  });
});

filterInput.addEventListener('change', renderTransactions);
searchInput.addEventListener('input', renderTransactions);

updateSummary();
renderTransactions();
