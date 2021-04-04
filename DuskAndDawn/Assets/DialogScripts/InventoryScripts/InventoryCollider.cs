using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InventoryCollider : MonoBehaviour {

    public Inventory inventory;

    // IInventoryItem interactableItem;

    public bool active = false;

    private void OnControllerColliderHit(ControllerColliderHit hit)
    {
    	IInventoryItem item = hit.collider.GetComponent<IInventoryItem>();
    	if (item != null)
    	{
            if (item.Name != "MoonFlower")
            {
                inventory.AddItem(item);
            }
    	}
    }
}

