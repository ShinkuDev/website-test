/* ==========================================================================
   LOGIKA PENGAMBILAN TIKET ANTREAN (tiket.html)
   ========================================================================== */

let ticketCounter = 15;

function handleTicketSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('userName').value;
  const service = document.getElementById('serviceType').value;

  const formattedNum = `A-${String(ticketCounter).padStart(3, '0')}`;
  ticketCounter++;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { 
    timeZone: 'Asia/Makassar', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Tampilkan data ke kartu cetak tiket
  document.getElementById('resTicketNum').textContent = formattedNum;
  document.getElementById('resName').textContent = name;
  document.getElementById('resService').textContent = service;
  document.getElementById('resTime').textContent = `Diterbitkan: ${timeStr} WITA`;

  // Sembunyikan form dan tampilkan tiket
  document.getElementById('ticketForm').style.display = 'none';
  document.getElementById('ticketResult').style.display = 'block';
}