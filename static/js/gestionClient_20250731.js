  // 初始化模式切换监听
  document.querySelectorAll('input[name="optradio"]').forEach(radio => {
    radio.addEventListener('change', handleModeChange);
  });

  function handleModeChange() {
    const mode = document.querySelector('input[name="optradio"]:checked').value;

    document.querySelector('.search_user').style.display = (mode === 'ajouter') ? 'none' : 'block';
    document.querySelector('.submit_confirm').style.display = (mode === 'vue') ? 'none' : 'block';

    document.querySelectorAll('.user-field').forEach(el => {
      el.disabled = !(mode === 'ajouter');
    });

    document.querySelectorAll('.edit-toggle').forEach(span => {
      span.classList.toggle('d-none', mode !== 'modifier');
    });

    // customer_id 显示控制
    document.getElementById('row_customer_id').style.display = (mode === 'ajouter') ? 'none' : 'flex';

    document.getElementById("submit_confirm").innerHTML = mode;

    if (mode === 'ajouter') {
      $('.affiche_select').addClass('d-none');
      $('.affiche_action').removeClass('d-none');
      document.getElementById("customer-form").reset();
      document.getElementById("Customer_ID").value = "";
      
    } 
  }

  function searchCustomers() {
    let query = document.getElementById('searchBox').value;

    axios.get("/gestionClient/user_search", { params: { query } })
      .then(response => {
        let rows = "";
        response.data.data.forEach(item => {
          rows += `
            <tr onclick="handleRowClick(this)" data-id="${item.id}">
              <td>${item.id}</td>
              <td>${item.name}</td>
              <td>${item.phone}</td>
              <td>${item.email}</td>
            </tr>`;
        });
        document.getElementById("search_results").innerHTML = rows;
        document.getElementById("search_results_title").innerHTML = `
            <tr>
              <th>ID</th><th>Name</th><th>Phone</th><th>Email</th>
            </tr>`;
      });
  }

  function handleRowClick(row) {
    const id = row.cells[0].textContent;

    $('.affiche_select').addClass('d-none');
    $('.affiche_action').removeClass('d-none');

    axios.get("/gestionClient/customer_per_info", { params: { query: id } })
      .then(response => {
        const item = response.data.customer[0];
        document.getElementById("Customer_ID").value = item.Customer_ID;
        document.getElementById("name_first").value = item.Name_first;
        document.getElementById("name_middle").value = item.Name_middle;
        document.getElementById("name_last").value = item.Name_last;
        document.getElementById("gender_select").value = item.Gendre;
        document.getElementById("date_of_birth").value = item.Birth_Day;
        document.getElementById("phone").value = item.Phone;
        document.getElementById("email").value = item.Email;
        document.getElementById("address").value = item.Address;
        document.getElementById("id_card_number").value = item.Number_Card_ID;
      });

    document.querySelectorAll('.client_search-table tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');

    handleModeChange();  // 确保字段状态刷新
  }

  // 单个开关编辑器
  function toggleEditable(el) {
    const input = el.previousElementSibling;
    input.disabled = !input.disabled;
    input.focus();
  }

  // 全局点击取消开关编辑
  document.addEventListener('click', function (e) {
    const isEditToggle = e.target.classList.contains('edit-toggle');
    const isInputField = e.target.classList.contains('user-field');

    if (!isEditToggle && !isInputField) {
    const mode = document.querySelector('input[name="optradio"]:checked').value;
    if (mode === 'modifier') {
        document.querySelectorAll('.edit-toggle').forEach(span => {
        span.previousElementSibling.disabled = true;
        });
    }
    }
  });

  document.getElementById("customer-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const mode = document.querySelector("input[name='optradio']:checked").value;
    const payload = {
      query: document.getElementById("Customer_ID").value,
      Name_first: document.getElementById("name_first").value,
      Name_middle: document.getElementById("name_middle").value,
      Name_last: document.getElementById("name_last").value,
      Gendre: document.getElementById("gender_select").value,
      Birth_Day: document.getElementById("date_of_birth").value,
      Phone: document.getElementById("phone").value,
      Email: document.getElementById("email").value,
      Address: document.getElementById("address").value,
      Number_Card_ID: document.getElementById("id_card_number").value
    };

    let url = "";
    if (mode === "modifier") url = "/gestionClient/modifier_user";
    else if (mode === "ajouter") url = "/gestionClient/ajouter_user";
    else if (mode === "supprimer") url = "/gestionClient/supprimer_user";
    else return;

    axios.post(url, payload)
      .then(response => {
        alert(response.data.message || response.data.error || "Opération réussie");
        document.querySelector(`input[name="optradio"][value="vue"]`).checked = true;
        handleModeChange();
      })
      .catch(error => alert("Erreur: " + error));
  });

  // 默认执行一次
  handleModeChange();

  document.getElementById("return_gestionClient").addEventListener("click", function () {
    $('.affiche_select').removeClass('d-none');
	$('.affiche_action').addClass('d-none');
    document.querySelector(`input[name="optradio"][value="vue"]`).checked = true;
    handleModeChange();
    document.getElementById("search_results").innerHTML = "";
    document.getElementById("search_results_title").innerHTML = "";
    //document.querySelector('.edit-toggle').classList.add('d-none');
    //document.querySelector('.control-buttons').classList.remove('d-none');
    //document.querySelector('.search-bar').classList.remove('d-none');

  });

