window.addEventListener('load', function() {
    insertTotalExclusions();
});

const insertTotalExclusions = async () => {
    const htmlElement = document.querySelector('#js_trackingjobsummary');
    if(!htmlElement) return;

    const tableElement = htmlElement.querySelector('tbody tbody tbody');
    const lastTrElement = tableElement.querySelector('tr:last-child');

    if(!lastTrElement || lastTrElement.classList.contains('tr-total-exclusion')) return;

    // Find total exclusions

    const regex = /\((\d+) *excluded\)/;
    const excludedCounts = [...lastTrElement.querySelectorAll('td.summary_value > div')].map(div => {
        const match = div.innerText.match(regex);
        return match ? match[1] : null;
    }).filter(text => text !== null);

    const sumExcluded = excludedCounts.reduce((sum, curr) => +sum + +curr, 0);

    const row = document.createElement('tr');
    row.classList.add('tr-total-exclusion');
    row.innerHTML = `
        <td class="summary_name">Total Excluded:</td>
        <td class="summary_value">
            <div>${sumExcluded}</div>
        </td>
    `
    tableElement.appendChild(row);
}