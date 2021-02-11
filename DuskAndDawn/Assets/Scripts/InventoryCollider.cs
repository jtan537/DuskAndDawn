using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InventoryCollider : MonoBehaviour {

    public InventoryTest inventory;

    private void OnControllerColliderHit(ControllerColliderHit hit)
    {
    	InventoryItem item = hit.collider.GetComponent<InventoryItem>();
    	if (item != null)
    	{
    		inventory.AddItem(item);
    	}
    }
}

