using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InventoryCollider : MonoBehaviour {

    public Inventory inventory;

    IInventoryItem interactableItem;

    public bool active = false;

    // void Update()
    // {
    //     if (active)
    //     {
    //         Debug.Log(interactableItem.Name);
    //         if (interactableItem != null)
    //         {
    //             if (Input.GetKeyDown(KeyCode.G))
    //             {
    //                 inventory.AddItem(interactableItem);
    //             }
    //         }
    //     }
    // }

    private void OnControllerColliderHit(ControllerColliderHit hit)
    {
    	IInventoryItem item = hit.collider.GetComponent<IInventoryItem>();
    	if (item != null)
    	{
            Debug.Log("Here");
            if (item.Name != "MoonFlower")
            {
                inventory.AddItem(item);
            }
    		else
            {
                interactableItem = item;
                if (Input.GetKeyDown(KeyCode.G))
                {
                    inventory.AddItem(interactableItem);
                }
            }
    	}
    }
}

