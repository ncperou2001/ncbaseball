console.log("Site loaded");

// Baseball data table functionality
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('/data/')) {
        loadBaseballData();
    }
});

let baseballData = [];
let sortColumn = null;
let sortDirection = 'asc';

async function loadBaseballData() {
    try {
        const response = await fetch('/assets/data/data.csv');
        const csvText = await response.text();
        
        // Parse CSV
        const rows = csvText.trim().split('\n');
        const headers = rows[0].split(',');
        
        baseballData = rows.slice(1).map(row => {
            const values = row.split(',');
            const dataRow = {};
            headers.forEach((header, index) => {
                dataRow[header] = values[index];
            });
            return dataRow;
        });
        
        renderTable(headers, baseballData);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('table-container').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('loading').textContent = 'Error loading data. Please try again.';
    }
}

function renderTable(headers, data) {
    const headerRow = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');
    
    // Clear existing content
    headerRow.innerHTML = '';
    tbody.innerHTML = '';
    
    // Create headers
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.addEventListener('click', () => sortTable(header));
        if (header === sortColumn) {
            th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }
        headerRow.appendChild(th);
    });
    
    // Create data rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            
            // Apply color coding
            applyColorCoding(td, header, row[header]);
            
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    const sortedData = [...baseballData].sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        // Try to parse as numbers for proper numeric sorting
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        if (sortDirection === 'asc') {
            return aVal.localeCompare(bVal);
        } else {
            return bVal.localeCompare(aVal);
        }
    });
    
    renderTable(Object.keys(baseballData[0]), sortedData);
}

function applyColorCoding(cell, header, value) {
    const numValue = parseFloat(value);
    
    // Color code velocity (velo)
    if (header === 'velo' && !isNaN(numValue)) {
        if (numValue >= 95) {
            cell.classList.add('velo-high');
        } else if (numValue >= 90) {
            cell.classList.add('velo-med');
        } else {
            cell.classList.add('velo-low');
        }
    }
    
    // Color code spin rate (spin)
    else if (header === 'spin' && !isNaN(numValue)) {
        if (numValue >= 2400) {
            cell.classList.add('spin-high');
        } else if (numValue >= 2000) {
            cell.classList.add('spin-med');
        } else {
            cell.classList.add('spin-low');
        }
    }
    
    // Color code movement metrics (ax, az, ext)
    else if (['ax', 'az', 'ext'].includes(header) && !isNaN(numValue)) {
        const absValue = Math.abs(numValue);
        if (absValue >= 15) {
            cell.classList.add('movement-good');
        } else if (absValue >= 5) {
            cell.classList.add('movement-avg');
        } else {
            cell.classList.add('movement-poor');
        }
    }
    
    // Color code percentage stats (sWHF, oWHF, sSS, oSS, aa)
    else if (['sWHF', 'oWHF', 'sSS', 'oSS', 'aa'].includes(header) && !isNaN(numValue)) {
        if (numValue >= 60) {
            cell.classList.add('velo-high'); // Green for high percentages
        } else if (numValue >= 40) {
            cell.classList.add('velo-med'); // Yellow for medium percentages
        } else {
            cell.classList.add('velo-low'); // Red for low percentages
        }
    }
}
