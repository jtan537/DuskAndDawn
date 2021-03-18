using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class UseItem : MonoBehaviour
{
    public Inventory inventory;
    public IInventoryItem item;

    public void OnItemClicked()
    {
    	inventory.UseItem(item);
    }
}
