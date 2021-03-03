using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ItemClickHandler : MonoBehaviour
{
	public Inventory inventory;
	public bool active = false;

    public void OnItemClicked()
    {
		ItemDragHandler dragHandler = 
    	gameObject.transform.Find("Item").GetComponent<ItemDragHandler>();

    	IInventoryItem item = dragHandler.Item;

    	if (active)
        {
            inventory.UseItem(item);
        }
    }
}
