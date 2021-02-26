using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TreeReceiver : MonoBehaviour
{
    public Inventory inventory;

    void Start()
    {
    	inventory.ItemUsed += Inventory_ItemUsed;
    }

    private void Inventory_ItemUsed(object sender, InventoryEventArgs e)
    {
    	IInventoryItem item = e.Item;

        Debug.Log("received");
    }
}
