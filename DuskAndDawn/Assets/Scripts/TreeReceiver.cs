using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TreeReceiver : MonoBehaviour
{
    public InventoryTest inventory;
    public TreeDialogManager dialog;

    void Start()
    {
    	inventory.ItemUsed += Inventory_ItemUsed;
    }

    private void Inventory_ItemUsed(object sender, InventoryEventArgs e)
    {
    	InventoryItem item = e.Item;

    	dialog.NextSentence();
    }
}
