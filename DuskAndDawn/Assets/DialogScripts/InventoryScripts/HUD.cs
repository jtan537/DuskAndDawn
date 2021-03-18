using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class HUD : MonoBehaviour
{
    [SerializeField]
    Metadata _metadata;

    public Inventory Inventory;

    private Canvas canvas;
    private bool show = false;
    private Metadata metadata;

    public GameObject detail;

    void Start()
    {
        metadata = GameObject.FindObjectOfType<Metadata>().GetComponent<Metadata>();

        Inventory.ItemAdded += InventoryScript_ItemAdded;
        Inventory.ItemRemoved += InventoryScript_ItemRemoved;
        canvas = gameObject.GetComponent<Canvas>();
        canvas.enabled = show;
    }

    void Update()
    {
        // Don't allow invetory usage in dialog
        if (_metadata.duskInDialog || _metadata.dawnInDialog)
        {
            show = false;
            canvas.enabled = show;
        }

        if (Input.GetKeyDown("b") && !_metadata.duskInDialog && !_metadata.dawnInDialog && gameObject.tag == metadata.curPlayer.name)
        {
            GetComponent<AudioSource>().Play();
            show = !show;
            canvas.enabled = show;

            if (!show)
            {
                detail.SetActive(false);
            }
        }
    }

    public void toggleHud(bool showHud)
    {
        show = showHud;
        canvas.enabled = show;
    }

    private void InventoryScript_ItemAdded(object sender, InventoryEventArgs e)
    {
    	Transform inventoryPanel = transform.Find("InventoryPanel");
        int index = -1;
    	foreach(Transform slot in inventoryPanel)
    	{
            index++;

            Transform imageTransform = slot.GetChild(0);
    		Image image = imageTransform.GetComponent<Image>();
            ItemDragHandler itemDragHandler = imageTransform.GetComponent<ItemDragHandler>();

            Transform countTransform = slot.GetChild(1);
            TextMeshProUGUI countText = countTransform.GetComponent<TextMeshProUGUI>();

            if (index == e.Item.Slot.Id)
            {
                image.enabled = true;
                image.sprite = e.Item.Image;

                int itemCount = e.Item.Slot.Count;
                if (itemCount > 1)
                    countText.text = itemCount.ToString();
                else
                    countText.text = "";

                itemDragHandler.Item = e.Item;
                break;
            }
      //       if (image.enabled)
      //       {
      //           if (image.enabled == e.Item.Image)
      //           {
      //               countText.SetText((int.Parse(countText.text) + 1).ToString());
      //               break;
      //           }
      //       }
    		// if (!image.enabled)
    		// {
    		// 	image.enabled = true;
    		// 	image.sprite = e.Item.Image;

      //           countText.SetText("1");

      //           itemDragHandler.Item = e.Item;

    		// 	break;
    		// }
    	}
    }

    private void InventoryScript_ItemRemoved(object sender, InventoryEventArgs e)
    {
        Transform inventoryPanel = transform.Find("InventoryPanel");
        int index = -1;
        foreach(Transform slot in inventoryPanel)
        {
            index++;

            Transform imageTransform = slot.GetChild(0);
            Image image = imageTransform.GetComponent<Image>();
            
            ItemDragHandler itemDragHandler = imageTransform.GetComponent<ItemDragHandler>();

            Transform countTransform = slot.GetChild(1);
            TextMeshProUGUI countText = countTransform.GetComponent<TextMeshProUGUI>();

            if (itemDragHandler.Item is null) { continue; }

            if (e.Item.Slot.Id == index)
            {
                int itemCount = e.Item.Slot.Count;
                itemDragHandler.Item = e.Item.Slot.FirstItem;

                if (itemCount < 2)
                {
                    countText.text = "";
                }
                else
                {
                    countText.text = itemCount.ToString();
                }

                if (itemCount == 0)
                {
                    image.enabled = false;
                    image.sprite = null;
                }
                break;
            }
            // if (itemDragHandler.Item.Equals(e.Item))
            // {
            //     if (countText.text == "1")
            //     {
            //         image.enabled = false;
            //         image.sprite = null;
            //         itemDragHandler.Item = null;

            //         countText.SetText("");

            //         break;
            //     }
            //     else
            //     {
            //         countText.SetText((int.Parse(countText.text) - 1).ToString());
            //         break;
            //     }
            // }
        }
    }
}
