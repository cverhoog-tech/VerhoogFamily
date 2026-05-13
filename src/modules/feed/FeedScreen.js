export function renderFeedScreen(container) {
  container.innerHTML = `
    <section class="feed-screen">
      <div class="feed-hero">
        <div class="feed-hero-title">Gezinsupdates</div>
      </div>

      <div class="feed-summary">
        <div class="feed-summary-card surface-card">
          <strong>4 taken</strong>
          <div>vandaag afgerond</div>
        </div>

        <div class="feed-summary-card surface-card">
          <strong>2 afspraken</strong>
          <div>voor morgen</div>
        </div>
      </div>

      <div class="feed-composer surface-card">
        <textarea class="feed-input" placeholder="Deel iets met het gezin..."></textarea>
      </div>

      <div class="feed-list">
        <div class="feed-item surface-card">
          <strong>Shane</strong>
          <p>heeft Keuken schoonmaken afgerond</p>
        </div>

        <div class="feed-item surface-card">
          <strong>Esra</strong>
          <p>heeft 3 foto's toegevoegd</p>
        </div>
      </div>
    </section>
  `;
}
