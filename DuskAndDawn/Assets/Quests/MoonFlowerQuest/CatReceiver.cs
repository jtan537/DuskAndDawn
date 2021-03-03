using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CatReceiver : MonoBehaviour
{
    public GameObject gem;

    CatQuest quest;

    public Inventory inventory;

    void Start()
    {
        quest = GameObject.FindObjectOfType<CatQuest>();
        inventory.ItemUsed += Inventory_ItemUsed;
    }

    public void Inventory_ItemUsed(object sender, InventoryEventArgs e)
    {
        IInventoryItem item = e.Item;

        if (item.Name == "MoonFlower")
        {
            item.OnUse();
            inventory.RemoveItem(item);
            Debug.Log("received");
            Debug.Log(quest.numRequiredFlowers);
        }

        if (quest.numRequiredFlowers == 0)
        {
            gem.SetActive(true);
        }
    }
}
