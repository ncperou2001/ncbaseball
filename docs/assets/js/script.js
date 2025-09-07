console.log("Site loaded");

// Baseball data table functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, current path:", window.location.pathname);
    console.log("Current origin:", window.location.origin);
    console.log("Current href:", window.location.href);
    
    if (window.location.pathname.includes('/data/')) {
        loadBaseballData();
    }
});

let baseballData = [];
let sortColumn = null;
let sortDirection = 'asc';

async function loadBaseballData() {
    console.log("Loading baseball data...");
    
    // Try multiple possible paths for the CSV file
    const possiblePaths = [
        '../assets/data/data.csv',      // relative from data directory
        '/assets/data/data.csv',        // absolute from site root
        'assets/data/data.csv',         // relative from current directory
        './assets/data/data.csv'        // explicit relative from current directory
    ];
    
    let lastError = null;
    
    for (const path of possiblePaths) {
        try {
            console.log("Trying path:", path);
            const response = await fetch(path);
            console.log("Fetch response:", response.status, response.statusText, "for path:", path);
            
            if (response.ok) {
                const csvText = await response.text();
                console.log("CSV data loaded successfully, length:", csvText.length);
                console.log("First 200 chars:", csvText.substring(0, 200));
                
                // Parse CSV with better handling
                const rows = csvText.trim().split('\n');
                console.log("Number of rows:", rows.length);
                
                if (rows.length < 2) {
                    throw new Error('CSV file appears to be empty or invalid');
                }
                
                const headers = rows[0].split(',').map(h => h.trim());
                console.log("Headers:", headers);
                console.log("Number of headers:", headers.length);
                
                baseballData = rows.slice(1).map((row, index) => {
                    const values = row.split(',').map(v => v.trim());
                    if (values.length !== headers.length) {
                        console.warn(`Row ${index + 1} has ${values.length} values but expected ${headers.length}`);
                        // Pad with empty strings if needed
                        while (values.length < headers.length) {
                            values.push('');
                        }
                    }
                    
                    const dataRow = {};
                    headers.forEach((header, headerIndex) => {
                        dataRow[header] = values[headerIndex] || '';
                    });
                    return dataRow;
                });
                
                console.log("Parsed data rows:", baseballData.length);
                console.log("Sample data row:", baseballData[0]);
                
                renderTable(headers, baseballData);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('table-container').style.display = 'block';
                return; // Success, exit the function
                
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`Failed to load from ${path}:`, error.message);
            lastError = error;
        }
    }
    
    // If we get here, all paths failed
    console.error('All paths failed. Last error:', lastError);
    document.getElementById('loading').textContent = `Error loading data: Could not find data file. Tried paths: ${possiblePaths.join(', ')}. Last error: ${lastError.message}`;
}

function renderTable(headers, data) {
    console.log("Rendering table with", headers.length, "headers and", data.length, "rows");
    
    const headerRow = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');
    
    if (!headerRow || !tbody) {
        console.error("Could not find table elements");
        document.getElementById('loading').textContent = 'Error: Could not find table elements in HTML';
        return;
    }
    
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
    data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            const cellValue = row[header] || '';
            td.textContent = cellValue;
            
            // Apply color coding
            applyColorCoding(td, header, cellValue);
            
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    
    console.log("Table rendered successfully");
}

function sortTable(column) {
    console.log("Sorting by column:", column);
    
    if (!baseballData || baseballData.length === 0) {
        console.error("No data to sort");
        return;
    }
    
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    const sortedData = [...baseballData].sort((a, b) => {
        let aVal = a[column] || '';
        let bVal = b[column] || '';
        
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
    
    const headers = Object.keys(baseballData[0] || {});
    renderTable(headers, sortedData);
}

function applyColorCoding(cell, header, value) {
    if (!value || value === '') return;
    
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
