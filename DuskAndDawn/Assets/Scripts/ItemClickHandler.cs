using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ItemClickHandler : MonoBehaviour
{
	public InventoryTest inventory;

    public void OnItemClicked()
    {
		ItemDragHandler dragHandler = 
    	gameObject.transform.Find("ItemImage").GetComponent<ItemDragHandler>();

    	InventoryItem item = dragHandler.Item;

    	inventory.UseItem(item);

    	inventory.RemoveItem(item);
    }
}
