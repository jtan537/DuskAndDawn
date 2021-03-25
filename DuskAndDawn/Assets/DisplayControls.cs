using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class DisplayControls : MonoBehaviour
{
    // Start is called before the first frame update
    bool show = true;
    public bool startShow = false;
    void Start()
    {
        gameObject.GetComponent<Image>().enabled = startShow;
        gameObject.GetComponent<CanvasRenderer>().SetAlpha(1.0f);
        
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown(KeyCode.X))
        {
            show = !show;
            gameObject.GetComponent<Image>().enabled = show;
        }
    }
}
