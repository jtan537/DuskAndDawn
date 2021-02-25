using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;

public class ItemDeleteHandler : MonoBehaviour
{
    public Inventory inventory;
    public Transform trans;

    public void OnItemClicked()
    {
		ItemDragHandler dragHandler = 
    	gameObject.transform.parent.gameObject.transform.Find("Item").GetComponent<ItemDragHandler>();

    	IInventoryItem item = dragHandler.Item;

    	item.OnDelete(trans);

    	inventory.RemoveItem(item);
    }
}
