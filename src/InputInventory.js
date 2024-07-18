import React, { useState } from 'react';
import './InputInventory.css';

const InputInventory = () => {
    const [inventory, setInventory] = useState({
        Jars: '',
        Lids: '',
        Labels: '',
        Boxes: '',
        Salt: '',
        Sugar: '',
        Soy: '',
        Peanuts: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInventory(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formattedInventory = Object.keys(inventory).map(item => ({
            product_name: item,
            quantity: parseFloat(inventory[item])
        }));

        try {
            for (const item of formattedInventory) {
                const response = await fetch('/api/inventories/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(item)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    alert(`Failed to update inventory: ${errorData.message}`);
                    return;
                }
            }
            alert('Inventory updated successfully!');
            setInventory({
                Jars: '',
                Lids: '',
                Labels: '',
                Boxes: '',
                Salt: '',
                Sugar: '',
                Soy: '',
                Peanuts: '',
            });
        } catch (error) {
            alert(`Failed to update inventory: ${error.message}`);
        }
    };

    return (
        <div className="input-inventory">
            <h2>Input Inventory</h2>
            <form onSubmit={handleSubmit}>
                {Object.keys(inventory).map(item => (
                    <div key={item} className="form-group">
                        <label>
                            {item.charAt(0).toUpperCase() + item.slice(1)}:
                            <input
                                type="text"
                                name={item}
                                value={inventory[item]}
                                onChange={handleChange}
                            />
                        </label>
                    </div>
                ))}
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default InputInventory;
