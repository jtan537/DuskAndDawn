using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InventoryCollider : MonoBehaviour {

    public Inventory inventory;

    private void OnControllerColliderHit(ControllerColliderHit hit)
    {
    	IInventoryItem item = hit.collider.GetComponent<IInventoryItem>();
    	if (item != null)
    	{
    		inventory.AddItem(item);
    	}
    }
}

